import type { Handler } from '@netlify/functions';
import type {
  ListsResponse,
  ApiError,
  ListType,
  Window,
  ListItem,
} from '../../src/lib/types';
import fs from 'fs/promises';

const FIXTURES: Record<string, string> = {
  'trending:ethereum:1h': '../../fixtures/lists-trending-eth-1h.json',
  'discovery:ethereum:1d': '../../fixtures/lists-discovery-eth-1d.json',
  'leaderboard:ethereum:1d': '../../fixtures/lists-leaderboard-eth-1d.json',
};

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const GT_API_BASE = process.env.GT_API_BASE || '';
const GT_API_KEY = process.env.GT_API_KEY || '';
const DS_API_BASE = process.env.DS_API_BASE || '';
const CG_API_BASE = process.env.COINGECKO_API_BASE || '';
const CG_API_KEY = process.env.COINGECKO_API_KEY || '';
const DEBUG = process.env.DEBUG_LOGS === 'true';

function log(...args: any[]) {
  if (DEBUG) console.log('[lists]', ...args);
}

function logError(...args: any[]) {
  console.error('[lists]', ...args);
}

function isValidType(t?: string): t is ListType {
  return t === 'trending' || t === 'discovery' || t === 'leaderboard';
}
function isValidWindow(w?: string): w is Window {
  return w === '1h' || w === '1d' || w === '1w';
}

async function readFixture(path: string): Promise<ListsResponse> {
  const url = new URL(path, import.meta.url);
  const data = await fs.readFile(url, 'utf8');
  return JSON.parse(data) as ListsResponse;
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(url, { signal: controller.signal, ...(init || {}) });
    if (!res.ok) throw new Error('status');
    return await res.json();
  } catch (err) {
    logError('fetch error', url, err);
    throw err;
  } finally {
    clearTimeout(id);
  }
}

// Static popular tokens per chain used to approximate trending when GT is
// unavailable. Addresses are checksummed.
const DS_POPULAR: Record<string, string[]> = {
  ethereum: [
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
  ],
};

function rank(items: ListItem[]): void {
  let maxVol = 0;
  let maxPrice = 0;
  let maxTrades = 0;
  for (const it of items) {
    if (it.volWindowUsd && it.volWindowUsd > maxVol) maxVol = it.volWindowUsd;
    if (it.priceChangePct !== undefined) {
      const p = Math.abs(it.priceChangePct);
      if (p > maxPrice) maxPrice = p;
    }
    if (it.tradesWindow && it.tradesWindow > maxTrades) maxTrades = it.tradesWindow;
  }
  for (const it of items) {
    const volScore = maxVol ? (it.volWindowUsd || 0) / maxVol : 0;
    const priceScore = maxPrice ? Math.abs(it.priceChangePct || 0) / maxPrice : 0;
    const tradeScore = maxTrades ? (it.tradesWindow || 0) / maxTrades : 0;
    it.score = 0.5 * volScore + 0.3 * priceScore + 0.2 * tradeScore;
  }
  items.sort((a, b) => {
    const diff = (b.score || 0) - (a.score || 0);
    if (diff !== 0) return diff;
    return a.pairId.localeCompare(b.pairId);
  });
}

export const handler: Handler = async (event) => {
  const chain = event.queryStringParameters?.chain;
  const type = event.queryStringParameters?.type as ListType | undefined;
  const window = event.queryStringParameters?.window as Window | undefined;
  const limitParam = event.queryStringParameters?.limit;
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const SUPPORTED_CHAINS = new Set([
    'ethereum',
    'bsc',
    'polygon',
    'optimism',
    'arbitrum',
    'avalanche',
    'base',
  ]);

  log('params', { chain, type, window, limit });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
    'x-provider': 'none',
    'x-fallbacks-tried': '',
    'x-items': '0',
  };
  if (!isValidType(type) || !isValidWindow(window)) {
    const body: ApiError = { error: 'invalid_request', provider: 'none' };
    return { statusCode: 400, headers, body: JSON.stringify(body) };
  }
  const attempted: string[] = [];
  try {

  if (!chain) {
    const bodyRes: ListsResponse = { chain: '', type: type!, window: window!, items: [], provider: 'none' };
    log('response', event.rawUrl, 200, 0, 'none');
    return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
  }
  if (!SUPPORTED_CHAINS.has(chain)) {
    const body: ApiError = { error: 'unsupported_network', provider: 'none' };
    log('response', event.rawUrl, 200, 0, 'none');
    return { statusCode: 200, headers, body: JSON.stringify(body) };
  }

  const key = `${type}:${chain}:${window}`;
  if (USE_FIXTURES) {
    const path = FIXTURES[key];
    if (!path) {
      const body: ApiError = { error: 'not_found', provider: 'none' };
      return { statusCode: 404, headers, body: JSON.stringify(body) };
    }
    try {
      const data = await readFixture(path);
      rank(data.items);
      if (limit !== undefined) data.items = data.items.slice(0, limit);
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch (err) {
      logError('fixture read failed', err);
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
  }

  const items: ListItem[] = [];
  let provider: 'gt' | 'ds' | 'cg' | 'none' = 'none';

  if (GT_API_BASE) {
    attempted.push('gt');
    try {
      const gtUrl = `${GT_API_BASE}/networks/${chain}/${type}?window=${window}${
        limit ? `&limit=${limit}` : ''
      }`;
      const init = GT_API_KEY ? { headers: { 'X-API-KEY': GT_API_KEY } } : undefined;
      const gt = await fetchJson(gtUrl, init);
      const dataArray = Array.isArray(gt?.data)
        ? gt.data
        : Array.isArray(gt?.items)
        ? gt.items
        : [];

      dataArray.forEach((d: any) => {
        const attr = d.attributes || {};
        const token = attr.base_token || attr.token || {};
        const volMap = attr.volume_usd || attr.volume || {};
        const priceChangeMap = attr.price_change_percentage || attr.priceChangePct || {};
        const txMap = attr.transaction_count || attr.txns || {};
        const windowKey = window === '1h' ? 'h1' : window === '1d' ? 'h24' : 'h7';
        const volWindow = volMap[windowKey];
        const priceChange = priceChangeMap[windowKey];
        const tradesWindow = txMap[windowKey];
        const createdAt = attr.pool_created_at
          ? Math.floor(new Date(attr.pool_created_at).getTime() / 1000)
          : attr.created_at
          ? Math.floor(new Date(attr.created_at).getTime() / 1000)
          : undefined;
        items.push({
          pairId: d.id || attr.pool_id || attr.address,
          chain: chain as string,
          token: {
            address: token.address,
            symbol: token.symbol,
            name: token.name,
          },
          priceUsd:
            attr.base_token_price_usd !== undefined
              ? Number(attr.base_token_price_usd)
              : attr.price_usd !== undefined
              ? Number(attr.price_usd)
              : undefined,
          liqUsd: attr.liquidity_usd !== undefined ? Number(attr.liquidity_usd) : undefined,
          volWindowUsd: volWindow !== undefined ? Number(volWindow) : undefined,
          priceChangePct: priceChange !== undefined ? Number(priceChange) : undefined,
          tradesWindow: tradesWindow !== undefined ? Number(tradesWindow) : undefined,
          createdAt,
        });
      });
      if (items.length > 0) {
        rank(items);
        provider = 'gt';
        log('gt items', items.length);
      }
    } catch (err) {
      logError('gt fetch failed', err);
      // noop, will fall back to DS
    }
  }

  if (items.length === 0 && CG_API_BASE && CG_API_KEY) {
    attempted.push('cg');
    try {
      const cgUrl = `${CG_API_BASE}/trending/${chain}?window=${window}`;
      const cg = await fetchJson(cgUrl, {
        headers: { 'x-cg-pro-api-key': CG_API_KEY },
      });
      const dataArray = Array.isArray(cg?.data) ? cg.data : [];
      dataArray.forEach((d: any) => {
        const attr = d.attributes || d;
        const token = attr.base_token || attr.token || {};
        const volMap = attr.volume_usd || attr.volume || {};
        const priceChangeMap = attr.price_change_percentage || attr.priceChangePct || {};
        const txMap = attr.transaction_count || attr.txns || {};
        const windowKey = window === '1h' ? 'h1' : window === '1d' ? 'h24' : 'h7';
        const volWindow = volMap[windowKey];
        const priceChange = priceChangeMap[windowKey];
        const tradesWindow = txMap[windowKey];
        items.push({
          pairId: d.id || attr.pool_id || attr.address || token.address,
          chain: chain!,
          token: {
            address: token.address,
            symbol: token.symbol,
            name: token.name,
          },
          priceUsd:
            attr.base_token_price_usd !== undefined
              ? Number(attr.base_token_price_usd)
              : attr.price_usd !== undefined
              ? Number(attr.price_usd)
              : undefined,
          liqUsd:
            attr.liquidity_usd !== undefined ? Number(attr.liquidity_usd) : undefined,
          volWindowUsd: volWindow !== undefined ? Number(volWindow) : undefined,
          priceChangePct: priceChange !== undefined ? Number(priceChange) : undefined,
          tradesWindow: tradesWindow !== undefined ? Number(tradesWindow) : undefined,
          createdAt:
            attr.pool_created_at
              ? Math.floor(new Date(attr.pool_created_at).getTime() / 1000)
              : attr.created_at
              ? Math.floor(new Date(attr.created_at).getTime() / 1000)
              : undefined,
        });
      });
      if (items.length > 0) {
        rank(items);
        provider = 'cg';
        log('cg items', items.length);
      }
    } catch (err) {
      logError('cg fetch failed', err);
      // ignore, fall through
    }
  }

  if (items.length === 0 && DS_API_BASE) {
    attempted.push('ds');
    const addresses = DS_POPULAR[chain] || [];
    for (const addr of addresses.slice(0, limit ?? addresses.length)) {
      try {
        const ds = await fetchJson(`${DS_API_BASE}/dex/tokens/${addr}`);
        const first = Array.isArray(ds.pairs) ? ds.pairs[0] : undefined;
        if (!first) continue;
        items.push({
          pairId: first.pairAddress || first.id || addr,
          chain: chain!,
          token: {
            address: addr,
            symbol: (ds.token && ds.token.symbol) || first.baseToken?.symbol,
            name: (ds.token && ds.token.name) || first.baseToken?.name,
          },
          priceUsd:
            first.priceUsd !== undefined
              ? Number(first.priceUsd)
              : first.price_usd !== undefined
              ? Number(first.price_usd)
              : undefined,
          liqUsd:
            first.liquidity?.usd !== undefined
              ? Number(first.liquidity.usd)
              : first.liquidityUsd !== undefined
              ? Number(first.liquidityUsd)
              : undefined,
          volWindowUsd:
            first.volume?.h24 !== undefined
              ? Number(first.volume.h24)
              : first.vol24hUsd !== undefined
              ? Number(first.vol24hUsd)
              : undefined,
          priceChangePct:
            first.priceChange?.h24 !== undefined
              ? Number(first.priceChange.h24)
              : first.priceChange24hPct !== undefined
              ? Number(first.priceChange24hPct)
              : undefined,
          createdAt:
            first.pairCreatedAt !== undefined
              ? Math.floor(new Date(first.pairCreatedAt).getTime() / 1000)
              : undefined,
        });
      } catch (err) {
        logError('ds fetch failed', addr, err);
        // ignore individual failures
      }
    }
    if (items.length > 0) {
      rank(items);
      provider = 'ds';
      log('ds items', items.length);
    }
  }

    const limited = limit !== undefined ? items.slice(0, limit) : items;
    const bodyRes: ListsResponse = { chain, type, window, items: limited, provider };
    headers['x-provider'] = provider;
    headers['x-fallbacks-tried'] = attempted.join(',');
    headers['x-items'] = String(limited.length);
    log('response', event.rawUrl, 200, limited.length, provider);
    return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
  } catch (err) {
    logError('handler error', err);
    const body: ApiError = { error: 'internal_error', provider: 'none' };
    return { statusCode: 500, headers, body: JSON.stringify(body) };
  }
};
