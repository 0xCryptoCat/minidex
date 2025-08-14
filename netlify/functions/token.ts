import type { Handler } from '@netlify/functions';
import type { TokenResponse, ApiError } from '../../src/lib/types';

const CG_API_BASE = process.env.COINGECKO_API_BASE || '';
const CG_API_KEY = process.env.COINGECKO_API_KEY || '';
const DS_API_BASE = process.env.DS_API_BASE || '';
const DEBUG = process.env.DEBUG_LOGS === 'true';

function log(...args: any[]) {
  if (DEBUG) console.log('[token]', ...args);
}

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

  let core: any = null;
  let provider: 'cg' | 'ds' | undefined;

  log('params', { chain, address });

  if (CG_API_BASE && CG_API_KEY) {
    try {
      const cg = await fetchCgToken(chain, address);
      const attr = cg?.data?.attributes || cg?.data || cg;
      const priceChange = attr?.price_change_percentage || {};
      core = {
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
      provider = 'cg';
      log('cg token');
    } catch {
      // ignore and fall back to DS
    }
  }

  if (!core && DS_API_BASE) {
    try {
      const res = await fetch(`${DS_API_BASE}/dex/tokens/${address}`);
      if (res.ok) {
        const ds = await res.json();
        const first = Array.isArray(ds.pairs) ? ds.pairs[0] : undefined;
        if (first) {
          core = {
            priceUsd:
              first.priceUsd !== undefined
                ? Number(first.priceUsd)
                : first.price_usd !== undefined
                ? Number(first.price_usd)
                : undefined,
            fdvUsd:
              first.fdv !== undefined
                ? Number(first.fdv)
                : first.fdvUsd !== undefined
                ? Number(first.fdvUsd)
                : undefined,
            liqUsd:
              first.liquidity?.usd !== undefined
                ? Number(first.liquidity.usd)
                : first.liquidityUsd !== undefined
                ? Number(first.liquidityUsd)
                : undefined,
            vol24hUsd:
              first.volume?.h24 !== undefined
                ? Number(first.volume.h24)
                : first.vol24hUsd !== undefined
                ? Number(first.vol24hUsd)
                : undefined,
            priceChange1hPct:
              first.priceChange?.h1 !== undefined
                ? Number(first.priceChange.h1)
                : undefined,
            priceChange24hPct:
              first.priceChange?.h24 !== undefined
                ? Number(first.priceChange.h24)
                : first.priceChange24hPct !== undefined
                ? Number(first.priceChange24hPct)
                : undefined,
          };
          provider = 'ds';
          log('ds token');
        }
      }
    } catch {
      // ignore
    }
  }

  if (core) {
    const bodyRes: TokenResponse = { chain, address, core, provider: provider! };
    return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
  }

  const body: ApiError = { error: 'upstream_error', provider: 'none' };
  return { statusCode: 500, headers, body: JSON.stringify(body) };
};

