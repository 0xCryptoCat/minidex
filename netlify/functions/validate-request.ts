/**
 * Server-side validation and processing endpoint
 * Validates JWT tokens and provides additional security checks
 */

import type { Handler } from '@netlify/functions';
import { validateJWT, checkRateLimit, sanitizeInput, extractAuthToken } from '../shared/jwt-middleware';

interface ValidationRequest {
  provider: string;
  endpoint: string;
  params: Record<string, any>;
  metadata?: {
    userAgent: string;
    timestamp: number;
    clientVersion?: string;
  };
}

interface ValidationResponse {
  valid: boolean;
  sanitizedParams?: Record<string, any>;
  error?: string;
  warnings?: string[];
  rateLimit?: {
    remaining: number;
    resetTime: number;
  };
}

// Security checks for different endpoints
const ENDPOINT_SECURITY_RULES = {
  search: {
    maxQueryLength: 100,
    allowedParams: ['q', 'query', 'chain', 'limit'],
    rateLimitMultiplier: 1,
  },
  ohlc: {
    allowedParams: ['pairId', 'chain', 'tf', 'poolAddress'],
    rateLimitMultiplier: 2, // OHLC calls are more expensive
  },
  trades: {
    allowedParams: ['pairId', 'chain', 'poolAddress', 'limit', 'token'],
    rateLimitMultiplier: 3, // Trades calls are most expensive
  },
  security: {
    allowedParams: ['contract_addresses', 'chain'],
    rateLimitMultiplier: 1,
  },
};

function detectSuspiciousActivity(params: Record<string, any>, metadata?: ValidationRequest['metadata']): string[] {
  const warnings: string[] = [];

  // Check for injection attempts
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // SQL injection patterns
      if (/['"`;\\]/g.test(value)) {
        warnings.push(`Suspicious characters in ${key}`);
      }
      
      // Script injection patterns
      if (/<script|javascript:/i.test(value)) {
        warnings.push(`Script injection attempt in ${key}`);
      }
      
      // Path traversal attempts
      if (/\.\.|\/\\/g.test(value)) {
        warnings.push(`Path traversal attempt in ${key}`);
      }
    }
  }

  // Check for rapid requests (could indicate bot activity)
  if (metadata?.timestamp) {
    const age = Date.now() - metadata.timestamp;
    if (age > 30000) { // Request older than 30 seconds
      warnings.push('Stale request timestamp');
    }
  }

  return warnings;
}

function validateEndpointParams(endpoint: string, params: Record<string, any>): { valid: boolean; sanitized: Record<string, any>; errors: string[] } {
  const rules = ENDPOINT_SECURITY_RULES[endpoint as keyof typeof ENDPOINT_SECURITY_RULES];
  const errors: string[] = [];
  const sanitized: Record<string, any> = {};

  if (!rules) {
    errors.push(`Unknown endpoint: ${endpoint}`);
    return { valid: false, sanitized: {}, errors };
  }

  // Check allowed parameters
  for (const [key, value] of Object.entries(params)) {
    if (!rules.allowedParams.includes(key)) {
      errors.push(`Parameter '${key}' not allowed for endpoint '${endpoint}'`);
      continue;
    }

    // Sanitize based on parameter type
    let sanitizedValue: string | null = null;
    
    switch (key) {
      case 'q':
      case 'query':
        if (typeof value === 'string' && value.length <= (rules as any).maxQueryLength || 100) {
          sanitizedValue = value.trim();
        }
        break;
        
      case 'contract_addresses':
      case 'address':
        sanitizedValue = sanitizeInput(value, 'address');
        break;
        
      case 'chain':
        sanitizedValue = sanitizeInput(value, 'chain');
        break;
        
      case 'pairId':
      case 'poolAddress':
        sanitizedValue = sanitizeInput(value, 'pairId');
        break;
        
      case 'tf':
      case 'timeframe':
        const validTf = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'];
        sanitizedValue = validTf.includes(value) ? value : null;
        break;
        
      case 'limit':
        const limit = parseInt(value);
        sanitizedValue = (limit > 0 && limit <= 1000) ? limit.toString() : null;
        break;
        
      case 'token':
        sanitizedValue = sanitizeInput(value, 'address');
        break;
        
      default:
        // Basic sanitization for other params
        if (typeof value === 'string' && value.length <= 200) {
          sanitizedValue = value.replace(/[^\w\s.-]/g, '').trim();
        }
    }

    if (sanitizedValue === null) {
      errors.push(`Invalid value for parameter '${key}'`);
    } else {
      sanitized[key] = sanitizedValue;
    }
  }

  return { valid: errors.length === 0, sanitized, errors };
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Extract and validate JWT token
    const token = extractAuthToken(event.headers);
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ valid: false, error: 'Missing authentication token' }),
      };
    }

    const jwtResult = validateJWT(token);
    if (!jwtResult.valid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ valid: false, error: jwtResult.error }),
      };
    }

    const payload = jwtResult.payload!;

    // Check rate limits
    const rules = ENDPOINT_SECURITY_RULES[event.body ? JSON.parse(event.body).endpoint : 'search'] || ENDPOINT_SECURITY_RULES.search;
    const effectiveRateLimit = {
      requests: Math.floor(payload.rateLimit.requests / (rules as any).rateLimitMultiplier || 1),
      window: payload.rateLimit.window,
    };

    if (!checkRateLimit(payload.userId, effectiveRateLimit)) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          valid: false, 
          error: 'Rate limit exceeded',
          rateLimit: {
            remaining: 0,
            resetTime: Date.now() + (effectiveRateLimit.window * 1000),
          },
        }),
      };
    }

    // Parse and validate request
    const request: ValidationRequest = JSON.parse(event.body || '{}');
    const { provider, endpoint, params, metadata } = request;

    // Detect suspicious activity
    const warnings = detectSuspiciousActivity(params, metadata);

    // Validate endpoint parameters
    const validation = validateEndpointParams(endpoint, params);
    if (!validation.valid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          valid: false, 
          error: 'Invalid parameters',
          errors: validation.errors,
          warnings,
        }),
      };
    }

    // Log for monitoring (in production, send to logging service)
    console.log(`API validation [${payload.userId}]:`, {
      provider,
      endpoint,
      paramCount: Object.keys(params).length,
      warnings: warnings.length,
      userAgent: metadata?.userAgent,
    });

    const response: ValidationResponse = {
      valid: true,
      sanitizedParams: validation.sanitized,
      warnings: warnings.length > 0 ? warnings : undefined,
      rateLimit: {
        remaining: effectiveRateLimit.requests - 1, // Approximate
        resetTime: Date.now() + (effectiveRateLimit.window * 1000),
      },
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Validation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        valid: false, 
        error: 'Internal validation error' 
      }),
    };
  }
};
