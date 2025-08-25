import type { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface AuthRequest {
  telegramData: string;
  userAgent: string;
  timestamp: number;
}

interface JWTPayload {
  userId: number;
  username?: string;
  iat: number;
  exp: number;
  scope: string[];
  rateLimit: {
    requests: number;
    window: number; // in seconds
  };
}

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const RATE_LIMITS = {
  basic: { requests: 100, window: 60 }, // 100 requests per minute
  premium: { requests: 500, window: 60 }, // 500 requests per minute
};

// Verify Telegram WebApp init data (reuse from telegram-auth.ts)
function verifyTelegramData(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex');
    
    return expectedHash === hash;
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return false;
  }
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    const { telegramData, userAgent, timestamp }: AuthRequest = JSON.parse(event.body || '{}');
    
    // Validate request timing (prevent replay attacks)
    const now = Date.now();
    if (!timestamp || Math.abs(now - timestamp) > 300000) { // 5 minutes
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Request too old or invalid timestamp' }),
      };
    }

    // Verify Telegram data integrity
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken || !verifyTelegramData(telegramData, botToken)) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid Telegram authentication' }),
      };
    }

    // Parse Telegram user data
    const params = new URLSearchParams(telegramData);
    const userDataStr = params.get('user');
    if (!userDataStr) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing user data' }),
      };
    }

    const userData = JSON.parse(userDataStr);
    const userId = userData.id;
    const username = userData.username;

    // Determine user permissions and rate limits
    const isPremium = userData.is_premium || false;
    const rateLimit = isPremium ? RATE_LIMITS.premium : RATE_LIMITS.basic;

    // Create JWT payload
    const payload: JWTPayload = {
      userId,
      username,
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + (24 * 60 * 60), // 24 hours
      scope: ['api:read', 'api:search', 'api:ohlc', 'api:trades'],
      rateLimit,
    };

    // Sign JWT
    const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token,
        expiresIn: 24 * 60 * 60,
        rateLimit,
        scope: payload.scope,
      }),
    };

  } catch (error) {
    console.error('Auth token error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
