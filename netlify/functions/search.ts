import type { Handler } from '@netlify/functions';
import type { SearchResponse, ApiError, Provider } from '../../src/lib/types';
import fs from 'fs/promises';

const GT_FIXTURE = '../../fixtures/search-gt.json';
const DS_FIXTURE = '../../fixtures/search-ds.json';

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const DS_API_BASE = process.env.DS_API_BASE || '';
const GT_API_BASE = process.env.GT_API_BASE || '';

function isValidAddress(addr?: string): addr is string {
  return !!addr && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

async function readFixture(path: string): Promise<SearchResponse> {
  const url = new URL(path, import.meta.url);
  const data = await fs.readFile(url, 'utf8');
  return JSON.parse(data) as SearchResponse;
}

async function fetchJson(url: string): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('status');
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

// Map numeric chain IDs from Dexscreener to chain slugs used in the app.
const CHAIN_ID_MAP: Record<string, string> = {
  '1': 'ethereum',
  '56': 'bsc',
  '137': 'polygon',
  '10': 'optimism',
  '42161': 'arbitrum',
  '43114': 'avalanche',
  '8453': 'base',
};

function mapChainId(id: unknown): string {
  const key = typeof id === 'number' ? String(id) : (id as string | undefined);
  return (key && CHAIN_ID_MAP[key]) || (key ?? 'unknown');
}

export const handler: Handler = async (event) => {
  const query =
    event.queryStringParameters?.query ||
    event.queryStringParameters?.address; // accept legacy "address" param
  const forceProvider = event.queryStringParameters?.provider as Provider | undefined;

  if (!isValidAddress(query)) {
    const body: ApiError = { error: 'invalid_address', provider: 'none' };
    return { statusCode: 400, body: JSON.stringify(body) };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
  };

  if (USE_FIXTURES) {
    try {
      if (forceProvider !== 'gt') {
        const ds = await readFixture(DS_FIXTURE);
        ds.query = query;
        return { statusCode: 200, headers, body: JSON.stringify(ds) };
      }
      throw new Error('force gt');
    } catch {
      try {
        const gt = await readFixture(GT_FIXTURE);
        gt.query = query;
        return { statusCode: 200, headers, body: JSON.stringify(gt) };
      } catch {
        const body: ApiError = { error: 'upstream_error', provider: 'none' };
        return { statusCode: 500, headers, body: JSON.stringify(body) };
      }
    }
  }

  try {
    if (forceProvider !== 'gt') {
      const ds = await fetchJson(`${DS_API_BASE}/dex/tokens/${query}`);
      if (!ds || !Array.isArray(ds.pairs) || ds.pairs.length === 0) {
        throw new Error('empty');
      }

      const tokenMeta = ds.token || ds.pairs[0]?.baseToken || {};
      const results = ds.pairs.map((pair: any) => {
        const chain = mapChainId(pair.chainId);
        const core = {
          priceUsd:
            pair.priceUsd !== undefined ? Number(pair.priceUsd) : undefined,
          fdvUsd:
            pair.fdv !== undefined
              ? Number(pair.fdv)
              : tokenMeta.fdv !== undefined
              ? Number(tokenMeta.fdv)
              : undefined,
          mcUsd:
            tokenMeta.mcap !== undefined
              ? Number(tokenMeta.mcap)
              : tokenMeta.marketCap !== undefined
              ? Number(tokenMeta.marketCap)
              : undefined,
          liqUsd:
            pair.liquidity?.usd !== undefined
              ? Number(pair.liquidity.usd)
              : undefined,
          vol24hUsd:
            pair.volume?.h24 !== undefined
              ? Number(pair.volume.h24)
              : undefined,
          priceChange1hPct:
            pair.priceChange?.h1 !== undefined
              ? Number(pair.priceChange.h1)
              : undefined,
          priceChange24hPct:
            pair.priceChange?.h24 !== undefined
              ? Number(pair.priceChange.h24)
              : undefined,
        };
        return {
          chain,
          token: {
            address: tokenMeta.address || pair.baseToken?.address || query,
            symbol: tokenMeta.symbol || pair.baseToken?.symbol || '',
            name: tokenMeta.name || pair.baseToken?.name || '',
            icon:
              tokenMeta.icon ||
              tokenMeta.imageUrl ||
              pair.info?.imageUrl ||
              undefined,
          },
          core,
          pools: [
            {
              pairId: pair.pairAddress,
              dex: pair.dexId,
              base: pair.baseToken?.symbol,
              quote: pair.quoteToken?.symbol,
              chain,
            },
          ],
          provider: 'ds',
        };
      });

      const bodyRes: SearchResponse = { query, results };
      return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
    }
    throw new Error('force gt');
  } catch {
    if (forceProvider === 'ds') {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
    try {
      const gt = await fetchJson(`${GT_API_BASE}/search/pairs?query=${query}`);
      if (!gt || Object.keys(gt).length === 0) throw new Error('empty');
      gt.provider = 'gt';
      gt.query = query;
      return { statusCode: 200, headers, body: JSON.stringify(gt) };
    } catch {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
  }
};

