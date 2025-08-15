import type { Handler } from '@netlify/functions';
import type {
  PairsResponse,
  ApiError,
  Provider,
  PoolSummary,
  TokenMeta,
  Address,
} from '../../src/lib/types';
import fs from 'fs/promises';
import { isGtSupported } from '../shared/dex-allow';

const GT_FIXTURE = '../../fixtures/pairs-gt.json';

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const DS_API_BASE = process.env.DS_API_BASE || '';
const GT_API_BASE = process.env.GT_API_BASE || '';
const DEBUG = process.env.DEBUG_LOGS === 'true';

function log(...args: any[]) {
  if (DEBUG) console.log('[pairs]', ...args);
}

function logError(...args: any[]) {
  console.error('[pairs]', ...args);
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

let SUPPORTED_CHAINS: Set<string> | null = null;
try {
  SUPPORTED_CHAINS = new Set(Object.values(CHAIN_ID_MAP));
} catch (err) {
  logError('failed to init supported chains', err);
}

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
    log('fetch', url);
    const res = await fetch(url, { signal: controller.signal });
    log('status', url, res.status);
    if (!res.ok) throw new Error(`status ${res.status}`);
    return await res.json();
  } catch (err) {
    logError('fetch error', url, err);
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export const handler: Handler = async (event) => {
  const chain = event.queryStringParameters?.chain;
  const address = event.queryStringParameters?.address;
  const forceProvider = event.queryStringParameters?.provider as Provider | undefined;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    'x-provider': 'none',
    'x-fallbacks-tried': '',
    'x-items': '0',
  };
  const attempted: string[] = [];
  let provider: Provider | 'none' = 'none';

  if (!SUPPORTED_CHAINS) {
    const body: ApiError = { error: 'config_error', provider: 'none' };
    log('response', event.rawUrl, 500, 0, provider);
    return { statusCode: 500, headers, body: JSON.stringify(body) };
  }

  log('params', { chain, address, forceProvider });

  if (!isValidChain(chain) || !isValidAddress(address)) {
    const body: ApiError = { error: 'invalid_request', provider: 'none' };
    log('response', event.rawUrl, 400, 0, provider);
    return { statusCode: 400, headers, body: JSON.stringify(body) };
  }
  if (!SUPPORTED_CHAINS.has(chain)) {
    const body: ApiError = { error: 'unsupported_network', provider: 'none' };
    log('response', event.rawUrl, 200, 0, provider);
    return { statusCode: 200, headers, body: JSON.stringify(body) };
  }
  try {
    try {
      if (USE_FIXTURES) {
        try {
          if (forceProvider !== 'gt') {
            attempted.push('ds');
            // No DS fixture; fall through to error to mimic real behavior
            throw new Error('no ds fixture');
          }
          throw new Error('force gt');
        } catch (err) {
          logError('ds fixture failed', err);
          try {
            attempted.push('gt');
            const gt = await readFixture(GT_FIXTURE);
            provider = 'gt';
            headers['x-provider'] = provider;
            headers['x-fallbacks-tried'] = attempted.join(',');
            headers['x-items'] = String(gt.pools.length);
            log('response', event.rawUrl, 200, gt.pools.length, provider);
            return { statusCode: 200, headers, body: JSON.stringify(gt) };
          } catch (err2) {
            logError('gt fixture failed', err2);
            headers['x-fallbacks-tried'] = attempted.join(',');
            const body: ApiError = { error: 'upstream_error', provider: 'none' };
            log('response', event.rawUrl, 500, 0, provider);
            return { statusCode: 500, headers, body: JSON.stringify(body) };
          }
        }
      }

      if (forceProvider !== 'gt') {
        attempted.push('ds');
        const dsUrl = `${DS_API_BASE}/dex/tokens/${address}`;
        let ds: any;
        try {
          log('try ds', dsUrl);
          ds = await fetchJson(dsUrl);
        } catch (err) {
          logError('ds request failed', dsUrl, err);
          ds = null;
        }
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

        const pools: PoolSummary[] = [];
        let gtArr: any[] = [];
        const needsGtPools = ds.pairs.some((p: any) => {
          const addr =
            p.pairAddress ||
            p.liquidityPoolAddress ||
            p.pair?.contract ||
            p.pair?.address;
          return !isValidAddress(addr);
        });
        if (needsGtPools) {
          const gtPoolsUrl = `${GT_API_BASE}/networks/${chain}/tokens/${address}/pools`;
          try {
            const gtPools = await fetchJson(gtPoolsUrl);
            gtArr = Array.isArray(gtPools?.data) ? gtPools.data : [];
          } catch (err) {
            logError('gt pools fetch failed', gtPoolsUrl, err);
          }
        }

        for (const p of ds.pairs) {
          const chainSlug = mapChainId(p.chainId);
          let poolAddr =
            p.pairAddress ||
            p.liquidityPoolAddress ||
            p.pair?.contract ||
            p.pair?.address;
          let liqUsd = p.liquidity?.usd ?? p.liquidityUsd;
          const version = p.dexVersion || p.version;
          const pairId = p.pairId || p.pair?.id || p.pairAddress || '';

          let match: any;
          if (gtArr.length) {
            match = gtArr.find((d) => {
              const attr = d.attributes || {};
              return (
                (attr.dex || '').toLowerCase() === (p.dexId || '').toLowerCase() &&
                attr.base_token?.symbol === p.baseToken?.symbol &&
                attr.quote_token?.symbol === p.quoteToken?.symbol
              );
            });
          }
          if (!isValidAddress(poolAddr)) {
            if (match && isValidAddress(match.attributes?.pool_address)) {
              poolAddr = match.attributes.pool_address;
            }
          }
          if (match) {
            const attr = match.attributes || {};
            if (liqUsd === undefined) {
              liqUsd = attr.reserve_in_usd ?? attr.reserve_usd;
            }
          }
          pools.push({
            pairId: pairId,
            dex: p.dexId,
            version,
            base: p.baseToken?.symbol,
            quote: p.quoteToken?.symbol,
            chain: chainSlug,
            poolAddress: isValidAddress(poolAddr) ? (poolAddr as Address) : undefined,
            liqUsd: liqUsd !== undefined ? Number(liqUsd) : undefined,
            gtSupported: isGtSupported(p.dexId, version),
          });
        }

        pools.sort((a, b) => {
          const sup = Number(!!b.gtSupported) - Number(!!a.gtSupported);
          if (sup !== 0) return sup;
          return (b.liqUsd || 0) - (a.liqUsd || 0);
        });

        provider = 'ds';
        headers['x-provider'] = provider;
        headers['x-fallbacks-tried'] = attempted.join(',');
        headers['x-items'] = String(pools.length);
        log('dexscreener pools', pools.length);
        log('response', event.rawUrl, 200, pools.length, provider);
        const bodyRes: PairsResponse = { token, pools, provider: 'ds' };
        return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
      }
      throw new Error('force gt');
    } catch (err) {
      logError('ds branch failed', err);
      if (forceProvider === 'ds') {
        headers['x-fallbacks-tried'] = attempted.join(',');
        const body: ApiError = { error: 'upstream_error', provider: 'none' };
        log('response', event.rawUrl, 500, 0, provider);
        return { statusCode: 500, headers, body: JSON.stringify(body) };
      }
      try {
        attempted.push('gt');
        const tokenUrl = `${GT_API_BASE}/networks/${chain}/tokens/${address}`;
        const poolsUrl = `${GT_API_BASE}/networks/${chain}/tokens/${address}/pools`;
        log('try gt', tokenUrl, poolsUrl);
        const tokenResp = await fetchJson(tokenUrl);
        const poolsResp = await fetchJson(poolsUrl);
        const pools: PoolSummary[] = [];
        const arr = Array.isArray(poolsResp?.data) ? poolsResp.data : [];
        for (const d of arr) {
          const attr = d.attributes || {};
          const dex = attr.dex || attr.name || '';
          const version = attr.version || attr.dex_version;
          const liqUsd = attr.reserve_in_usd ?? attr.reserve_usd;
          pools.push({
            pairId: d.id,
            dex,
            version,
            base: attr.base_token?.symbol,
            quote: attr.quote_token?.symbol,
            chain: chain as string,
            poolAddress: attr.pool_address as Address,
            liqUsd: liqUsd !== undefined ? Number(liqUsd) : undefined,
            gtSupported: isGtSupported(dex, version),
          });
        }

        pools.sort((a, b) => {
          const sup = Number(!!b.gtSupported) - Number(!!a.gtSupported);
          if (sup !== 0) return sup;
          return (b.liqUsd || 0) - (a.liqUsd || 0);
        });
        const attr = tokenResp.data?.attributes || {};
        const token: TokenMeta = {
          address: attr.address || address,
          symbol: attr.symbol || '',
          name: attr.name || '',
          icon: attr.image_url || undefined,
        };
        provider = 'gt';
        headers['x-provider'] = provider;
        headers['x-fallbacks-tried'] = attempted.join(',');
        headers['x-items'] = String(pools.length);
        log('gt pools', pools.length);
        const bodyRes: PairsResponse = { token, pools, provider: 'gt' };
        if (!pools.length) throw new Error('empty');
        log('response', event.rawUrl, 200, pools.length, provider);
        return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
      } catch (err) {
        logError('gt branch failed', err);
        headers['x-fallbacks-tried'] = attempted.join(',');
        const body: ApiError = { error: 'upstream_error', provider: 'none' };
        log('response', event.rawUrl, 500, 0, provider);
        return { statusCode: 500, headers, body: JSON.stringify(body) };
      }
    }
  } catch (err) {
    logError('handler error', err);
    headers['x-fallbacks-tried'] = attempted.join(',');
    const body: ApiError = { error: 'internal_error', provider: 'none' };
    return { statusCode: 500, headers, body: JSON.stringify(body) };
  }
};

