import type { Handler } from '@netlify/functions';
import type { TokenResponse, ApiError } from '../../src/lib/types';

const CG_API_BASE = process.env.COINGECKO_API_BASE || '';
const CG_API_KEY = process.env.COINGECKO_API_KEY || '';

function isValidChain(chain?: string): chain is string {
  return !!chain;
}

function isValidAddress(addr?: string): addr is string {
  return !!addr && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

async function fetchCgToken(chain: string, address: string): Promise<any> {
  const urls = [
    `${CG_API_BASE}/token-data/${chain}/${address}`,
    `${CG_API_BASE}/tokens-data?network=${chain}&contract_addresses=${address}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'x-cg-pro-api-key': CG_API_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // try next
    }
  }
  throw new Error('cg_error');
}

export const handler: Handler = async (event) => {
  const chain = event.queryStringParameters?.chain;
  const address = event.queryStringParameters?.address;

  if (!isValidChain(chain) || !isValidAddress(address)) {
    const body: ApiError = { error: 'invalid_request', provider: 'none' };
    return { statusCode: 400, body: JSON.stringify(body) };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
  };

  if (!CG_API_BASE || !CG_API_KEY) {
    const body: ApiError = { error: 'upstream_error', provider: 'none' };
    return { statusCode: 500, headers, body: JSON.stringify(body) };
  }

  try {
    const cg = await fetchCgToken(chain, address);
    const attr = cg?.data?.attributes || cg?.data || cg;
    const priceChange = attr?.price_change_percentage || {};
    const core = {
      priceUsd: attr?.price_usd !== undefined ? Number(attr.price_usd) : undefined,
      mcUsd:
        attr?.market_cap_usd !== undefined
          ? Number(attr.market_cap_usd)
          : undefined,
      fdvUsd:
        attr?.fully_diluted_valuation_usd !== undefined
          ? Number(attr.fully_diluted_valuation_usd)
          : undefined,
      liqUsd:
        attr?.liquidity_usd !== undefined ? Number(attr.liquidity_usd) : undefined,
      vol24hUsd:
        attr?.volume_24h_usd !== undefined ? Number(attr.volume_24h_usd) : undefined,
      priceChange1hPct:
        priceChange?.h1 !== undefined ? Number(priceChange.h1) : undefined,
      priceChange24hPct:
        priceChange?.h24 !== undefined ? Number(priceChange.h24) : undefined,
    };
    const bodyRes: TokenResponse = { chain, address, core, provider: 'cg' };
    return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
  } catch {
    const body: ApiError = { error: 'upstream_error', provider: 'none' };
    return { statusCode: 500, headers, body: JSON.stringify(body) };
  }
};

