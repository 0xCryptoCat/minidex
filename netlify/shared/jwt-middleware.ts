import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  username?: string;
  iat: number;
  exp: number;
  scope: string[];
  rateLimit: {
    requests: number;
    window: number;
  };
}

interface ValidationResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || '';

// In-memory rate limiting (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function validateJWT(token: string): ValidationResult {
  try {
    if (!JWT_SECRET) {
      return { valid: false, error: 'JWT secret not configured' };
    }

    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Invalid token' };
  }
}

export function checkRateLimit(userId: number, rateLimit: { requests: number; window: number }): boolean {
  const key = `user:${userId}`;
  const now = Date.now();
  const windowMs = rateLimit.window * 1000;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset window
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= rateLimit.requests) {
    return false; // Rate limit exceeded
  }
  
  current.count++;
  return true;
}

export function sanitizeInput(input: any, type: 'address' | 'chain' | 'pairId'): string | null {
  if (typeof input !== 'string') return null;
  
  const trimmed = input.trim();
  
  switch (type) {
    case 'address':
      // EVM: 0x + 40 hex chars, Solana: base58, etc.
      if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return trimmed.toLowerCase();
      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) return trimmed;
      return null;
      
    case 'chain':
      // Allow known chain names only
      const validChains = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'solana'];
      return validChains.includes(trimmed.toLowerCase()) ? trimmed.toLowerCase() : null;
      
    case 'pairId':
      // Basic alphanumeric with some special chars
      return /^[a-zA-Z0-9_-]{10,100}$/.test(trimmed) ? trimmed : null;
      
    default:
      return null;
  }
}

export function extractAuthToken(headers: Record<string, string | undefined>): string | null {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader) return null;
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute
