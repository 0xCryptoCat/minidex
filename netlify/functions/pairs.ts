import type { Handler } from '@netlify/functions';
import type { PairsResponse, ApiError, Provider, PoolSummary, TokenMeta } from '../../src/lib/types';
import fs from 'fs/promises';

const GT_FIXTURE = '../../fixtures/pairs-gt.json';

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const DS_API_BASE = process.env.DS_API_BASE || '';
const GT_API_BASE = process.env.GT_API_BASE || '';

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

function isValidAddress(addr?: string): addr is string {
  return !!addr && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function isValidChain(chain?: string): chain is string {
  return !!chain;
}

async function readFixture(path: string): Promise<PairsResponse> {
  const url = new URL(path, import.meta.url);
  const data = await fs.readFile(url, 'utf8');
  return JSON.parse(data) as PairsResponse;
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

export const handler: Handler = async (event) => {
  const chain = event.queryStringParameters?.chain;
  const address = event.queryStringParameters?.address;
  const forceProvider = event.queryStringParameters?.provider as Provider | undefined;

  if (!isValidChain(chain) || !isValidAddress(address)) {
    const body: ApiError = { error: 'invalid_request', provider: 'none' };
    return { statusCode: 400, body: JSON.stringify(body) };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
  };

  if (USE_FIXTURES) {
    try {
      if (forceProvider !== 'gt') {
        // No DS fixture; fall through to error to mimic real behavior
        throw new Error('no ds fixture');
      }
      throw new Error('force gt');
    } catch {
      try {
        const gt = await readFixture(GT_FIXTURE);
        return { statusCode: 200, headers, body: JSON.stringify(gt) };
      } catch {
        const body: ApiError = { error: 'upstream_error', provider: 'none' };
        return { statusCode: 500, headers, body: JSON.stringify(body) };
      }
    }
  }

  try {
    if (forceProvider !== 'gt') {
      const ds = await fetchJson(`${DS_API_BASE}/dex/tokens/${address}`);
      if (!ds || !Array.isArray(ds.pairs) || ds.pairs.length === 0) {
        throw new Error('empty');
      }

      const tokenMeta = ds.token || ds.pairs[0]?.baseToken || {};
      const token: TokenMeta = {
        address: tokenMeta.address || address,
        symbol: tokenMeta.symbol || '',
        name: tokenMeta.name || '',
        icon: tokenMeta.icon || tokenMeta.imageUrl || undefined,
      };

      const pools: PoolSummary[] = ds.pairs.map((p: any) => ({
        pairId: p.pairAddress,
        dex: p.dexId,
        base: p.baseToken?.symbol,
        quote: p.quoteToken?.symbol,
        chain: mapChainId(p.chainId),
      }));

      const bodyRes: PairsResponse = { token, pools, provider: 'ds' };
      return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
    }
    throw new Error('force gt');
  } catch {
    if (forceProvider === 'ds') {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
    try {
      const gt = await fetchJson(`${GT_API_BASE}/networks/${chain}/tokens/${address}`);
      const pools: PoolSummary[] = [];
      if (Array.isArray(gt.included)) {
        for (const inc of gt.included) {
          if (inc.type !== 'pool') continue;
          const attr = inc.attributes || {};
          pools.push({
            pairId: inc.id,
            dex: attr.dex || attr.name || '',
            base: attr.base_token?.symbol,
            quote: attr.quote_token?.symbol,
            chain: chain as string,
          });
        }
      }
      const attr = gt.data?.attributes || {};
      const token: TokenMeta = {
        address: attr.address || address,
        symbol: attr.symbol || '',
        name: attr.name || '',
        icon: attr.image_url || undefined,
      };
      const bodyRes: PairsResponse = { token, pools, provider: 'gt' };
      if (!pools.length) throw new Error('empty');
      return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
    } catch {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
  }
};

