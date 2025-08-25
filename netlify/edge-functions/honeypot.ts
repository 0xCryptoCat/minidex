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

function parseParams(url: URL): RequestParams | null {
  const chain = url.searchParams.get('chain');
  const address = url.searchParams.get('address');
  
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

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'public, max-age=600, stale-while-revalidate=1200',
    'Content-Type': 'application/json',
  };
}

export default async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: corsHeaders() });
  }
  
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders(),
    });
  }
  
  const url = new URL(request.url);
  const params = parseParams(url);
  
  if (!params) {
    return new Response(JSON.stringify({ error: 'Missing required parameters: chain, address' }), {
      status: 400,
      headers: corsHeaders(),
    });
  }
  
  const { chain, address } = params;
  
  // Validate and map chain ID
  const mappedChainId = getMappedChainId(chain);
  if (!mappedChainId) {
    return new Response(JSON.stringify({ 
      success: false,
      error: `Unsupported chain: ${chain}. HoneyPot.is only supports Ethereum, BSC, and Base.`,
      supportedChains: Object.keys(HONEYPOT_CHAIN_MAPPING),
      chain,
      address,
    }), {
      status: 200,
      headers: corsHeaders(),
    });
  }
  
  // Validate address format
  if (!address || address.length < 10) {
    return new Response(JSON.stringify({ error: 'Invalid address format' }), {
      status: 400,
      headers: corsHeaders(),
    });
  }
  
  try {
    // Fetch honeypot data from HoneyPot.is
    const honeypotData = await fetchHoneypotData(mappedChainId, address);
    
    // Process and normalize the response
    const honeypotResponse = processHoneypotResponse(honeypotData, mappedChainId, address);
    
    return new Response(JSON.stringify(honeypotResponse), {
      status: 200,
      headers: corsHeaders(),
    });
    
  } catch (error) {
    console.error('HoneyPot.is API error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Request timeout',
          chain: mappedChainId,
          address,
        }), {
          status: 200,
          headers: corsHeaders(),
        });
      }
      
      if (error.message.includes('HoneyPot.is API error')) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Upstream API error',
          details: error.message,
          chain: mappedChainId,
          address,
        }), {
          status: 200,
          headers: corsHeaders(),
        });
      }
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Service temporarily unavailable',
      chain: mappedChainId,
      address,
    }), {
      status: 200,
      headers: corsHeaders(),
    });
  }
}