import type { Handler } from '@netlify/functions';
import type {
  SearchResponse,
  ApiError,
  Provider,
  TokenMeta,
  SearchResult,
} from '../../src/lib/types';
import fs from 'fs/promises';

const GT_FIXTURE = '../../fixtures/search-gt.json';
const DS_FIXTURE = '../../fixtures/search-ds.json';

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const DS_API_BASE = process.env.DS_API_BASE || '';
const GT_API_BASE = process.env.GT_API_BASE || '';
const CG_API_BASE = process.env.COINGECKO_API_BASE || '';
const CG_API_KEY = process.env.COINGECKO_API_KEY || '';
const DEBUG = process.env.DEBUG_LOGS === 'true';

function log(...args: any[]) {
  if (DEBUG) console.log('[search]', ...args);
}

function isValidAddress(addr?: string): addr is string {
  return !!addr && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function isValidChain(chain?: string): chain is string {
  return !!chain;
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
  const chain = event.queryStringParameters?.chain;

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
    log('params', { query, chain, forceProvider });
    if (forceProvider === 'cg') {
      if (!isValidChain(chain) || !CG_API_BASE || !CG_API_KEY) {
        throw new Error('force gt');
      }
      const cgUrl = `${CG_API_BASE}/token-data/${chain}/${query}`;
      const res = await fetch(cgUrl, { headers: { 'x-cg-pro-api-key': CG_API_KEY } });
      if (!res.ok) throw new Error('status');
      const cg = await res.json();
      const attr = cg?.data?.attributes || cg?.data || cg;
      const priceChange = attr?.price_change_percentage || {};
      const token: TokenMeta = {
        address: query,
        symbol: attr.symbol || '',
        name: attr.name || '',
        icon: attr.image_url || undefined,
      };
      const core = {
        priceUsd: attr.price_usd !== undefined ? Number(attr.price_usd) : undefined,
        fdvUsd:
          attr.fully_diluted_valuation_usd !== undefined
            ? Number(attr.fully_diluted_valuation_usd)
            : undefined,
        mcUsd:
          attr.market_cap_usd !== undefined ? Number(attr.market_cap_usd) : undefined,
        liqUsd:
          attr.liquidity_usd !== undefined ? Number(attr.liquidity_usd) : undefined,
        vol24hUsd:
          attr.volume_24h_usd !== undefined ? Number(attr.volume_24h_usd) : undefined,
        priceChange1hPct:
          priceChange.h1 !== undefined ? Number(priceChange.h1) : undefined,
        priceChange24hPct:
          priceChange.h24 !== undefined ? Number(priceChange.h24) : undefined,
      };
      const results: SearchResult[] = [{
        chain: chain!,
        token,
        core,
        pools: [],
        provider: 'cg',
      }];
      const bodyRes: SearchResponse = { query, results };
      return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
    }
    if (forceProvider !== 'gt') {
      const ds = await fetchJson(`${DS_API_BASE}/dex/tokens/${query}`);
      if (!ds || !Array.isArray(ds.pairs) || ds.pairs.length === 0) {
        throw new Error('empty');
      }

      const tokenMeta = ds.token || ds.pairs[0]?.baseToken || {};
      const results: SearchResult[] = [];
      for (const pair of ds.pairs) {
        const chainSlug = mapChainId(pair.chainId);
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
        let poolAddr = pair.pairAddress || pair.liquidityPoolAddress;
        if (!isValidAddress(poolAddr)) {
          try {
            const detail = await fetchJson(
              `${DS_API_BASE}/dex/pairs/${chainSlug}/${
                pair.pairId || pair.pairAddress
              }`
            );
            poolAddr =
              detail?.pair?.pairAddress || detail?.pair?.address || detail?.pairAddress;
          } catch {
            // ignore
          }
        }
        if (!isValidAddress(poolAddr)) {
          try {
            const gt = await fetchJson(
              `${GT_API_BASE}/networks/${chainSlug}/tokens/${pair.baseToken?.address || query}/pools`
            );
            const first = gt?.data && gt.data[0];
            poolAddr = first?.attributes?.pool_address;
          } catch {
            // ignore
          }
        }

        results.push({
          chain: chainSlug,
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
              pairId: pair.pairId || pair.pairAddress,
              dex: pair.dexId,
              base: pair.baseToken?.symbol,
              quote: pair.quoteToken?.symbol,
              chain: chainSlug,
              poolAddress: isValidAddress(poolAddr) ? poolAddr : undefined,
            },
          ],
          provider: 'ds',
        });
      }

      log('dexscreener results', results.length);
      const bodyRes: SearchResponse = { query, results };
      return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
    }
    throw new Error('force gt');
  } catch {
    log('ds branch failed');
    if (forceProvider === 'ds') {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
    try {
      const gt = await fetchJson(`${GT_API_BASE}/search/pairs?query=${query}`);
      const arr = Array.isArray(gt?.data) ? gt.data : [];
      const results: SearchResult[] = arr.map((d: any) => {
        const attr = d.attributes || {};
        const token = attr.base_token || attr.token || {};
        return {
          chain: attr.network || chain || 'unknown',
          token: {
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            icon: token.image_url || undefined,
          },
          core: {
            priceUsd:
              attr.base_token_price_usd !== undefined
                ? Number(attr.base_token_price_usd)
                : attr.price_usd !== undefined
                ? Number(attr.price_usd)
                : undefined,
            liqUsd:
              attr.liquidity_usd !== undefined ? Number(attr.liquidity_usd) : undefined,
            vol24hUsd:
              attr.volume_24h_usd !== undefined ? Number(attr.volume_24h_usd) : undefined,
            priceChange1hPct:
              attr.price_change_percentage?.h1 !== undefined
                ? Number(attr.price_change_percentage.h1)
                : undefined,
            priceChange24hPct:
              attr.price_change_percentage?.h24 !== undefined
                ? Number(attr.price_change_percentage.h24)
                : undefined,
          },
          pools: [
            {
              pairId: d.id,
              dex: attr.dex || attr.name || '',
              base: attr.base_token?.symbol,
              quote: attr.quote_token?.symbol,
              chain: attr.network || chain || 'unknown',
              poolAddress: attr.pool_address || d.id,
            },
          ],
          provider: 'gt',
        };
      });
      log('gt results', results.length);
      const bodyRes: SearchResponse = { query, results };
      if (!results.length) throw new Error('empty');
      return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
    } catch {
      if (CG_API_BASE && CG_API_KEY && isValidChain(chain)) {
        try {
          const cgUrl = `${CG_API_BASE}/token-data/${chain}/${query}`;
          const res = await fetch(cgUrl, { headers: { 'x-cg-pro-api-key': CG_API_KEY } });
          if (res.ok) {
            const cg = await res.json();
            const attr = cg?.data?.attributes || cg?.data || cg;
            const priceChange = attr?.price_change_percentage || {};
            const token: TokenMeta = {
              address: query,
              symbol: attr.symbol || '',
              name: attr.name || '',
              icon: attr.image_url || undefined,
            };
            const core = {
              priceUsd:
                attr.price_usd !== undefined ? Number(attr.price_usd) : undefined,
              fdvUsd:
                attr.fully_diluted_valuation_usd !== undefined
                  ? Number(attr.fully_diluted_valuation_usd)
                  : undefined,
              mcUsd:
                attr.market_cap_usd !== undefined
                  ? Number(attr.market_cap_usd)
                  : undefined,
              liqUsd:
                attr.liquidity_usd !== undefined
                  ? Number(attr.liquidity_usd)
                  : undefined,
              vol24hUsd:
                attr.volume_24h_usd !== undefined
                  ? Number(attr.volume_24h_usd)
                  : undefined,
              priceChange1hPct:
                priceChange.h1 !== undefined ? Number(priceChange.h1) : undefined,
              priceChange24hPct:
                priceChange.h24 !== undefined ? Number(priceChange.h24) : undefined,
            };
            const results: SearchResult[] = [
              { chain: chain!, token, core, pools: [], provider: 'cg' },
            ];
            const bodyRes: SearchResponse = { query, results };
            return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
          }
        } catch {
          // ignore
        }
      }
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
  }
};

