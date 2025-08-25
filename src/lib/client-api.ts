/**
 * Client-side API manager with JWT authentication and direct external API calls
 * This replaces the server-side proxy pattern while maintaining security
 */

interface AuthToken {
  token: string;
  expiresIn: number;
  rateLimit: {
    requests: number;
    window: number;
  };
  scope: string[];
}

interface APIConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  rateLimitKey?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  validateParams?: boolean;
}

class ClientAPIManager {
  private authToken: AuthToken | null = null;
  private requestCount = 0;
  private windowStart = Date.now();
  
  private readonly configs: Record<string, APIConfig> = {
    geckoterminal: {
      baseUrl: 'https://api.geckoterminal.com/api/v2',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SmallDEX/1.0',
      },
      rateLimitKey: 'gt',
    },
    dexscreener: {
      baseUrl: 'https://api.dexscreener.com',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SmallDEX/1.0',
      },
      rateLimitKey: 'ds',
    },
    goplus: {
      baseUrl: 'https://api.gopluslabs.io/api/v1',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SmallDEX/1.0',
      },
      rateLimitKey: 'goplus',
    },
  };

  /**
   * Authenticate and get JWT token
   */
  async authenticate(): Promise<boolean> {
    try {
      // Check if we're in development mode and allow non-Telegram access
      const allowNonTelegram = import.meta.env.VITE_ALLOW_NON_TELEGRAM === 'true';
      
      console.log('Client API Authentication:', {
        allowNonTelegram,
        env: import.meta.env.VITE_ALLOW_NON_TELEGRAM,
        hasTelegram: !!(window as any).Telegram?.WebApp,
        hasInitData: !!(window as any).Telegram?.WebApp?.initData,
      });
      
      let telegramData = null;
      
      // Try to get Telegram WebApp data
      const telegram = (window as any).Telegram?.WebApp;
      if (telegram?.initData) {
        telegramData = telegram.initData;
        console.log('Using Telegram init data');
      } else if (!allowNonTelegram) {
        throw new Error('Telegram WebApp not available and non-Telegram access is disabled');
      } else {
        console.log('Using development mode (no Telegram data)');
      }

      // Request JWT token from our auth endpoint
      const response = await fetch('/.netlify/functions/auth-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramData: telegramData,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          developmentMode: allowNonTelegram && !telegramData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Auth endpoint error:', error);
        throw new Error(error.error || 'Authentication failed');
      }

      this.authToken = await response.json();
      console.log('Authentication successful:', { 
        token: this.authToken.token ? 'present' : 'missing',
        rateLimit: this.authToken.rateLimit 
      });
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  /**
   * Check if we have a valid token
   */
  isAuthenticated(): boolean {
    if (!this.authToken) return false;
    
    const now = Date.now();
    const tokenAge = now - (this.authToken.expiresIn * 1000);
    return tokenAge < 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Check rate limits before making request
   */
  private checkRateLimit(): boolean {
    if (!this.authToken) return false;

    const now = Date.now();
    const windowMs = this.authToken.rateLimit.window * 1000;
    
    // Reset window if needed
    if (now - this.windowStart > windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    
    return this.requestCount < this.authToken.rateLimit.requests;
  }

  /**
   * Sanitize and validate parameters
   */
  private validateParams(params: Record<string, any>): Record<string, string> {
    const validated: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value !== 'string') continue;
      
      const trimmed = value.trim();
      
      switch (key) {
        case 'address':
          // Validate address format
          if (/^0x[a-fA-F0-9]{40}$/.test(trimmed) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
            validated[key] = trimmed.toLowerCase();
          }
          break;
          
        case 'chain':
          // Validate chain names
          const validChains = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'solana'];
          if (validChains.includes(trimmed.toLowerCase())) {
            validated[key] = trimmed.toLowerCase();
          }
          break;
          
        case 'pairId':
          // Validate pair ID format
          if (/^[a-zA-Z0-9_-]{10,100}$/.test(trimmed)) {
            validated[key] = trimmed;
          }
          break;
          
        case 'tf':
        case 'timeframe':
          // Validate timeframe
          const validTf = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'];
          if (validTf.includes(trimmed)) {
            validated[key] = trimmed;
          }
          break;
          
        default:
          // For other params, basic sanitization
          if (trimmed.length <= 100 && /^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
            validated[key] = trimmed;
          }
      }
    }
    
    return validated;
  }

  /**
   * Validate request with server before making API call
   */
  private async validateWithServer(
    provider: string,
    endpoint: string,
    params: Record<string, any>
  ): Promise<{ valid: boolean; sanitizedParams?: Record<string, any>; warnings?: string[] }> {
    const response = await fetch('/.netlify/functions/validate-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken!.token}`,
      },
      body: JSON.stringify({
        provider,
        endpoint,
        params,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          clientVersion: '1.0.0',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Validation failed');
    }

    return await response.json();
  }

  /**
   * Make authenticated API call with server-side validation and rate limiting
   */
  async call(
    provider: keyof typeof this.configs,
    endpoint: string,
    params: Record<string, any> = {},
    options: RequestOptions = {}
  ): Promise<any> {
    // Ensure we're authenticated
    if (!this.isAuthenticated()) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        throw new Error('Authentication required');
      }
    }

    const config = this.configs[provider];
    if (!config) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    // Server-side validation (includes rate limiting, injection detection, etc.)
    const validation = await this.validateWithServer(provider, endpoint, params);
    if (!validation.valid) {
      throw new Error('Request validation failed');
    }

    // Log any warnings
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('Request warnings:', validation.warnings);
    }

    // Use sanitized parameters from server
    const sanitizedParams = validation.sanitizedParams || {};

    // Build URL with sanitized parameters
    const url = new URL(endpoint, config.baseUrl);
    for (const [key, value] of Object.entries(sanitizedParams)) {
      url.searchParams.set(key, value);
    }

    // Prepare request
    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers: {
        ...config.headers,
        ...options.headers,
        // Don't include JWT in external API calls for security
      },
      signal: AbortSignal.timeout(options.timeout || 5000),
    };

    if (options.body) {
      requestOptions.body = options.body;
    }

    try {
      // Make the direct API call to external service
      // The external service sees the request coming from the user's browser, not our server
      const response = await fetch(url.toString(), requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API call failed [${provider}]:`, error);
      throw error;
    }
  }

  /**
   * Search tokens across providers with fallback
   */
  async search(query: string, chain?: string): Promise<any> {
    console.log('Search called with:', { query, chain });
    
    const providers: (keyof typeof this.configs)[] = ['dexscreener', 'geckoterminal'];
    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        console.log(`Trying search with provider: ${provider}`);
        
        if (provider === 'dexscreener') {
          return await this.call('dexscreener', '/latest/dex/search', { q: query });
        } else if (provider === 'geckoterminal') {
          return await this.call('geckoterminal', '/search/pairs', { query });
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`Search failed on ${provider}:`, error);
        continue;
      }
    }

    console.error('All search providers failed:', lastError);
    throw lastError || new Error('All search providers failed');
  }

  /**
   * Get OHLC data with provider fallback
   */
  async getOHLC(params: { pairId: string; chain: string; tf: string }): Promise<any> {
    try {
      // Try GeckoTerminal first
      return await this.call('geckoterminal', `/networks/${params.chain}/pools/${params.pairId}/ohlcv/${params.tf}`);
    } catch (error) {
      // Could implement DexScreener fallback here if they have OHLC endpoint
      throw error;
    }
  }

  /**
   * Get security data
   */
  async getSecurity(address: string, chain: string): Promise<any> {
    const endpoint = chain === 'solana' 
      ? '/solana/token_security'
      : `/token_security/${chain}`;
      
    return await this.call('goplus', endpoint, { contract_addresses: address });
  }
}

// Singleton instance
export const apiManager = new ClientAPIManager();

// Export types for use in components
export type { AuthToken, APIConfig, RequestOptions };
