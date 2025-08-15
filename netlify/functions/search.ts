import type { Handler } from '@netlify/functions';
import type {
  SearchResponse,
  Provider,
  SearchTokenSummary,
  PoolSummary,
  ApiError,
} from '../../src/lib/types';
import { isGtSupported } from '../shared/dex-allow';
import fs from 'fs/promises';

const GT_FIXTURE = '../../fixtures/search-gt.json';
const DS_FIXTURE = '../../fixtures/search-ds.json';

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const DS_API_BASE = process.env.DS_API_BASE || '';
const GT_API_BASE = process.env.GT_API_BASE || '';
const DEBUG = process.env.DEBUG_LOGS === 'true';

function log(...args: any[]) {
  if (DEBUG) console.log('[search]', ...args);
}

function logError(...args: any[]) {
  console.error('[search]', ...args);
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
  } catch (err) {
    logError('fetch error', url, err);
    throw err;
  } finally {
    clearTimeout(id);
  }
}

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
    event.queryStringParameters?.address ||
    '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    'x-provider': 'none',
    'x-fallbacks-tried': '',
    'x-items': '0',
  };

  const attempted: string[] = [];
  let provider: Provider | 'none' = 'none';
  try {
    if (USE_FIXTURES) {
      try {
        const ds = await readFixture(DS_FIXTURE);
        ds.query = query;
        headers['x-provider'] = ds.results[0]?.provider || 'ds';
        headers['x-items'] = String(ds.results.length);
        return { statusCode: 200, headers, body: JSON.stringify(ds) };
      } catch (err) {
        logError('fixture read failed', err);
      }
    }

    try {
      attempted.push('ds');
      const ds = await fetchJson(`${DS_API_BASE}/dex/tokens/${query}`);
      const pairs = Array.isArray(ds?.pairs) ? ds.pairs : [];
      if (pairs.length) {
        const tokenMeta = ds.token || pairs[0]?.baseToken || {};
      const pools: PoolSummary[] = [];
      let totalLiq = 0;
      let totalVol = 0;
      let bestLiq = 0;
      let bestPrice = 0;
      let gtPools = 0;
      const chainTotals: Record<string, number> = {};
      for (const p of pairs) {
        const chainSlug = mapChainId(p.chainId);
        const liq =
          p.liquidity?.usd !== undefined
            ? Number(p.liquidity.usd)
            : p.liquidityUsd !== undefined
            ? Number(p.liquidityUsd)
            : 0;
        const vol = p.volume?.h24 !== undefined ? Number(p.volume.h24) : 0;
        const price = p.priceUsd !== undefined ? Number(p.priceUsd) : undefined;
        const gt = isGtSupported(p.dexId, p.dexVersion || p.version);
        pools.push({
          pairId: p.pairId || p.pairAddress,
          dex: p.dexId,
          version: p.dexVersion || p.version,
          base: p.baseToken?.symbol,
          quote: p.quoteToken?.symbol,
          chain: chainSlug,
          poolAddress: p.pairAddress,
          liqUsd: liq,
          gtSupported: gt,
        });
        totalLiq += liq;
        totalVol += vol;
        if (price !== undefined && liq > bestLiq) {
          bestLiq = liq;
          bestPrice = price;
        }
        chainTotals[chainSlug] = (chainTotals[chainSlug] || 0) + liq;
        if (gt) gtPools++;
      }
      const chainEntries = Object.entries(chainTotals).sort((a, b) => b[1] - a[1]);
      const chainIcons = chainEntries.slice(0, 3).map(([c]) => c);
      const summary: SearchTokenSummary = {
        address: tokenMeta.address || query,
        symbol: tokenMeta.symbol || '',
        name: tokenMeta.name || '',
        icon: tokenMeta.icon || tokenMeta.imageUrl || undefined,
        priceUsd: bestPrice,
        liqUsd: totalLiq,
        vol24hUsd: totalVol,
        chainIcons,
        poolCount: pools.length,
        gtSupported: gtPools > 0,
        provider: 'ds',
        chainCount: chainEntries.length,
        pools,
      };
      const bodyRes: SearchResponse = { query, results: [summary] };
      provider = 'ds';
      headers['x-provider'] = provider;
      headers['x-fallbacks-tried'] = attempted.join(',');
      headers['x-items'] = '1';
      log('response', event.rawUrl, 200, 1, provider);
      return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
    }
    throw new Error('empty');
    } catch (err) {
      logError('ds branch failed', err);
    }

    try {
      attempted.push('gt');
      const gt = await fetchJson(`${GT_API_BASE}/search/pairs?query=${query}`);
      const arr = Array.isArray(gt?.data) ? gt.data : [];
    if (!arr.length) throw new Error('empty');
    const pools: PoolSummary[] = [];
    let totalLiq = 0;
    let totalVol = 0;
    let bestLiq = 0;
    let bestPrice = 0;
    let gtPools = 0;
    const chainTotals: Record<string, number> = {};
    let tokenMeta: any = {};
    for (const d of arr) {
      const attr = d.attributes || {};
      const token = attr.base_token || attr.token || {};
      tokenMeta.address = token.address || query;
      tokenMeta.symbol = token.symbol || '';
      tokenMeta.name = token.name || '';
      tokenMeta.icon = token.image_url || undefined;
      const chainSlug = attr.network || 'unknown';
      const liq =
        attr.liquidity_usd !== undefined
          ? Number(attr.liquidity_usd)
          : attr.reserve_in_usd !== undefined
          ? Number(attr.reserve_in_usd)
          : attr.reserve_usd !== undefined
          ? Number(attr.reserve_usd)
          : 0;
      const vol = attr.volume_24h_usd !== undefined ? Number(attr.volume_24h_usd) : 0;
      const price =
        attr.base_token_price_usd !== undefined
          ? Number(attr.base_token_price_usd)
          : attr.price_usd !== undefined
          ? Number(attr.price_usd)
          : undefined;
      const gt = isGtSupported(attr.dex || attr.name, attr.version || attr.dex_version);
      pools.push({
        pairId: d.id,
        dex: attr.dex || attr.name || '',
        version: attr.version || attr.dex_version,
        base: attr.base_token?.symbol,
        quote: attr.quote_token?.symbol,
        chain: chainSlug,
        poolAddress: attr.pool_address || d.id,
        liqUsd: liq,
        gtSupported: gt,
      });
      totalLiq += liq;
      totalVol += vol;
      if (price !== undefined && liq > bestLiq) {
        bestLiq = liq;
        bestPrice = price;
      }
      chainTotals[chainSlug] = (chainTotals[chainSlug] || 0) + liq;
      if (gt) gtPools++;
    }
    const chainEntries = Object.entries(chainTotals).sort((a, b) => b[1] - a[1]);
    const chainIcons = chainEntries.slice(0, 3).map(([c]) => c);
    const summary: SearchTokenSummary = {
      address: tokenMeta.address || query,
      symbol: tokenMeta.symbol || '',
      name: tokenMeta.name || '',
      icon: tokenMeta.icon,
      priceUsd: bestPrice,
      liqUsd: totalLiq,
      vol24hUsd: totalVol,
      chainIcons,
      poolCount: pools.length,
      gtSupported: gtPools > 0,
      provider: 'gt',
      chainCount: chainEntries.length,
      pools,
    };
    const bodyRes: SearchResponse = { query, results: [summary] };
    provider = 'gt';
    headers['x-provider'] = provider;
    headers['x-fallbacks-tried'] = attempted.join(',');
    headers['x-items'] = '1';
    log('response', event.rawUrl, 200, 1, provider);
    return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
    } catch (err) {
      logError('gt branch failed', err);
    }
    headers['x-fallbacks-tried'] = attempted.join(',');
    const empty: SearchResponse = { query, results: [] };
    log('response', event.rawUrl, 200, 0, 'none');
    return { statusCode: 200, headers, body: JSON.stringify(empty) };
  } catch (err) {
    logError('handler error', err);
    headers['x-fallbacks-tried'] = attempted.join(',');
    const body: ApiError = { error: 'internal_error', provider: 'none' };
    return { statusCode: 500, headers, body: JSON.stringify(body) };
  }
};

