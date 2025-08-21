// HoneyPot.is API integration for Netlify Functions

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

// HoneyPot.is only supports these chains
const HONEYPOT_CHAIN_MAPPING: Record<string, string> = {
  '1': '1',           // Ethereum
  '56': '56',         // BSC  
  '8453': '8453',     // Base
  'ethereum': '1',
  'bsc': '56',
  'base': '8453',
};

const HONEYPOT_BASE_URL = 'https://api.honeypot.is/v2';

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
  const chainLower = chain.toLowerCase();
  return HONEYPOT_CHAIN_MAPPING[chainLower] || HONEYPOT_CHAIN_MAPPING[chain] || null;
}

async function fetchHoneypotData(chainId: string, address: string): Promise<any> {
  // Build URL with required parameters
  const url = new URL(`${HONEYPOT_BASE_URL}/IsHoneypot`);
  url.searchParams.set('address', address);
  url.searchParams.set('chainID', chainId);
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'MiniDEX/1.0',
      // No API key required currently per documentation
    },
    // 5 second timeout for honeypot check
    signal: AbortSignal.timeout(5000),
  });
  
  if (!response.ok) {
    throw new Error(`HoneyPot.is API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

function processHoneypotResponse(data: any, chain: string, address: string) {
  try {
    return {
      success: true,
      data: data,
      chain,
      address,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to process HoneyPot.is response: ${error}`,
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
    'Cache-Control': 'public, max-age=600, stale-while-revalidate=1200', // 10min cache, 20min stale
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
      statusCode: 200, // Return success but with unsupported chain info
      headers,
      body: JSON.stringify({ 
        success: false,
        error: `Unsupported chain: ${chain}. HoneyPot.is only supports Ethereum, BSC, and Base.`,
        supportedChains: Object.keys(HONEYPOT_CHAIN_MAPPING),
        chain,
        address,
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
    // Fetch honeypot data from HoneyPot.is
    const honeypotData = await fetchHoneypotData(mappedChainId, address);
    
    // Process and normalize the response
    const honeypotResponse = processHoneypotResponse(honeypotData, mappedChainId, address);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(honeypotResponse),
    };
    
  } catch (error) {
    console.error('HoneyPot.is API error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          statusCode: 200, // Return as available but failed
          headers,
          body: JSON.stringify({ 
            success: false,
            error: 'Request timeout',
            chain: mappedChainId,
            address,
          }),
        };
      }
      
      if (error.message.includes('HoneyPot.is API error')) {
        return {
          statusCode: 200, // Return as available but failed
          headers,
          body: JSON.stringify({ 
            success: false,
            error: 'Upstream API error',
            details: error.message,
            chain: mappedChainId,
            address,
          }),
        };
      }
    }
    
    return {
      statusCode: 200, // Return as available but failed
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Service temporarily unavailable',
        chain: mappedChainId,
        address,
      }),
    };
  }
};
