// Chain ID mappings for GoPlus
const GOPLUS_CHAIN_MAPPING: Record<string, string> = {
  // Ethereum and EVM chains (use numerical chain IDs)
  '1': '1',           // Ethereum
  '56': '56',         // BSC
  '137': '137',       // Polygon
  '42161': '42161',   // Arbitrum
  '10': '10',         // Optimism
  '8453': '8453',     // Base
  '43114': '43114',   // Avalanche
  '250': '250',       // Fantom
  
  // String-based mappings for common names
  'ethereum': '1',
  'bsc': '56',
  'polygon': '137',
  'arbitrum': '42161',
  'optimism': '10',
  'base': '8453',
  'avalanche': '43114',
  'fantom': '250',
  
  // Special cases
  'solana': 'solana',  // Uses beta API
  'sui': 'sui',        // Future support
};

// Unified security response
interface SecurityResponse {
  success: boolean;
  data?: {
    evm?: any;
    solana?: any;
    sui?: any;
  };
  error?: string;
  chain: string;
  address: string;
}

interface HandlerEvent {
  httpMethod: string;
  queryStringParameters?: Record<string, string> | null;
}

interface HandlerResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

type Handler = (event: HandlerEvent) => Promise<HandlerResponse>;

const GOPLUS_BASE_URL = 'https://api.gopluslabs.io/api/v1';
const GOPLUS_SOLANA_URL = 'https://api.gopluslabs.io/api/v1/solana';
const GOPLUS_SUI_URL = 'https://api.gopluslabs.io/api/v1/sui';

interface RequestParams {
  chain: string;
  address: string;
}

function parseParams(event: HandlerEvent): RequestParams | null {
  const { chain, address } = event.queryStringParameters || {};
  
  if (!chain || !address) {
    return null;
  }
  
  return { chain, address };
}

function getMappedChainId(chain: string): string | null {
  // Convert to lowercase for mapping
  const chainLower = chain.toLowerCase();
  return GOPLUS_CHAIN_MAPPING[chainLower] || GOPLUS_CHAIN_MAPPING[chain] || null;
}

function isSolana(chainId: string): boolean {
  return chainId === 'solana';
}

function isSui(chainId: string): boolean {
  return chainId === 'sui';
}

async function fetchGoPlusTokenSecurity(chainId: string, address: string): Promise<any> {
  let url: string;
  
  if (isSolana(chainId)) {
    // Use Solana beta API
    url = `${GOPLUS_SOLANA_URL}/token_security?contract_addresses=${address}`;
  } else if (isSui(chainId)) {
    // Use Sui API
    url = `${GOPLUS_SUI_URL}/token_security?contract_addresses=${address}`;
  } else {
    // Use EVM API
    url = `${GOPLUS_BASE_URL}/token_security/${chainId}?contract_addresses=${address}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'MiniDEX/1.0',
    },
    // 3 second timeout as per security.md
    signal: AbortSignal.timeout(3000),
  });
  
  if (!response.ok) {
    throw new Error(`GoPlus API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

function processGoPlusResponse(data: any, chain: string, address: string): SecurityResponse {
  try {
    if (isSolana(chain)) {
      // Process Solana response - extract token data from result[token_address]
      const result = data?.result || {};
      // For Solana, the result is structured as { "token_address": { ...tokenData } }
      const tokenData = result[address] || {};
      return {
        success: true,
        data: {
          solana: tokenData,
        },
        chain,
        address,
      };
    } else if (isSui(chain)) {
      // Process Sui response
      const result = data?.result?.[address.toLowerCase()] || {};
      return {
        success: true,
        data: {
          sui: result,
        },
        chain,
        address,
      };
    } else {
      // Process EVM response
      const result = data?.result?.[address.toLowerCase()] || {};
      return {
        success: true,
        data: {
          evm: result,
        },
        chain,
        address,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to process GoPlus response: ${error}`,
      chain,
      address,
    };
  }
}

export const handler: Handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5min cache, 10min stale
    'Content-Type': 'application/json',
  };
  
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }
  
  const params = parseParams(event);
  if (!params) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required parameters: chain, address' }),
    };
  }
  
  const { chain, address } = params;
  
  // Validate and map chain ID
  const mappedChainId = getMappedChainId(chain);
  if (!mappedChainId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: `Unsupported chain: ${chain}`,
        supportedChains: Object.keys(GOPLUS_CHAIN_MAPPING),
      }),
    };
  }
  
  // Validate address format
  if (!address || address.length < 10) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid address format' }),
    };
  }
  
  try {
    // Fetch security data from GoPlus
    const goPlusData = await fetchGoPlusTokenSecurity(mappedChainId, address);
    
    // Process and normalize the response
    const securityResponse = processGoPlusResponse(goPlusData, mappedChainId, address);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(securityResponse),
    };
    
  } catch (error) {
    console.error('Security API error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          statusCode: 408,
          headers,
          body: JSON.stringify({ 
            error: 'Request timeout',
            chain: mappedChainId,
            address,
          }),
        };
      }
      
      if (error.message.includes('GoPlus API error')) {
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({ 
            error: 'Upstream API error',
            details: error.message,
            chain: mappedChainId,
            address,
          }),
        };
      }
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        chain: mappedChainId,
        address,
      }),
    };
  }
};
