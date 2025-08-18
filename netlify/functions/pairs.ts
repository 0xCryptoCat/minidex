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
import { toGTNetwork, CHAIN_TO_GT_NETWORK, isPriorityChain } from '../shared/chains';

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
  '250': 'fantom',
  '59144': 'linea',
  '534352': 'scroll',
  '324': 'zksync',
  '5000': 'mantle',
  '1284': 'moonbeam',
  '1285': 'moonriver',
  '25': 'cronos',
  '1666600000': 'harmony',
  '42220': 'celo',
  '1313161554': 'aurora',
  '1088': 'metis',
  '288': 'boba',
  '2222': 'kava',
  '100': 'gnosis',
  // Add more chain ID mappings as needed
  // To add non-EVM like Solana, Aptos, etc., use their common names
  'solana': 'solana',
  'aptos': 'aptos',
  'sui': 'sui',
  'sei': 'sei',
  'manta': 'manta',
  'lightlink': 'lightlink',
  'alveychain': 'alveychain',
  'arbitrumnova': 'arbitrumnova',
  'astr': 'astr',
  'bitgert': 'bitgert',
  // Add more mappings as needed
};

// Use all supported chains from our comprehensive chain mapping
let SUPPORTED_CHAINS: Set<string> | null = null;
try {
  SUPPORTED_CHAINS = new Set(Object.keys(CHAIN_TO_GT_NETWORK));
} catch (err) {
  logError('failed to init supported chains', err);
}

function mapChainId(id: unknown): string {
  const key = typeof id === 'number' ? String(id) : (id as string | undefined);
  return (key && CHAIN_ID_MAP[key]) || (key ?? 'unknown');
}

function isValidAddress(addr?: string, chain?: string): addr is string {
  if (!addr) return false;
  
  // EVM chains: 0x followed by 40 hex characters
  if (chain && ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base', 'fantom', 'linea', 'scroll', 'zksync', 'mantle', 'moonbeam', 'moonriver', 'cronos', 'harmony', 'celo', 'aurora', 'metis', 'boba', 'kava', 'gnosis'].includes(chain)) {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  }
  
  // Solana: base58 encoded, typically 32-44 chars
  if (chain === 'solana') {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
  }
  
  // TON: EQxxxx or UQxxxx format
  if (chain === 'ton') {
    return /^(EQ|UQ)[A-Za-z0-9_-]{46}$/.test(addr);
  }
  
  // SUI: 0x followed by 64 hex characters
  if (chain === 'sui') {
    return /^0x[a-fA-F0-9]{64}$/.test(addr);
  }
  
  // Aptos: 0x followed by up to 64 hex characters (can be shorter)
  if (chain === 'aptos') {
    return /^0x[a-fA-F0-9]{1,64}$/.test(addr);
  }
  
  // Near: account names ending with .near or implicit accounts (hex)
  if (chain === 'near') {
    return /^[a-z0-9._-]+\.near$/.test(addr) || /^[a-f0-9]{64}$/.test(addr);
  }
  
  // Cosmos ecosystem: bech32 addresses starting with various prefixes
  if (['cosmos', 'osmosis', 'sei', 'injective', 'juno', 'stargaze', 'canto', 'evmos'].includes(chain || '')) {
    return /^[a-z]{1,10}1[a-z0-9]{38,58}$/.test(addr);
  }
  
  // For other chains or unknown chains, accept various formats
  // This is more permissive to handle new chains
  return addr.length >= 10 && addr.length <= 100;
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
    'x-gt-network': 'none',
  };
  const attempted: string[] = [];
  let provider: Provider | 'none' = 'none';

  if (!SUPPORTED_CHAINS) {
    const body: ApiError = { error: 'config_error', provider: 'none' };
    logError('config error: supported chains missing');
    log('response', event.rawUrl, 500, 0, provider);
    return { statusCode: 500, headers, body: JSON.stringify(body) };
  }

  log('params', { chain, address, forceProvider });

  if (!isValidChain(chain) || !isValidAddress(address, chain)) {
    const body: ApiError = { error: 'invalid_request', provider: 'none' };
    logError('invalid request', { chain, address });
    log('response', event.rawUrl, 400, 0, provider);
    return { statusCode: 400, headers, body: JSON.stringify(body) };
  }
  if (!SUPPORTED_CHAINS.has(chain)) {
    const body: ApiError = { error: 'unsupported_network', provider: 'none' };
    logError('unsupported network', chain);
    log('response', event.rawUrl, 200, 0, provider);
    return { statusCode: 200, headers, body: JSON.stringify(body) };
  }

  const markUnsupported = () => {
    headers['x-gt-network'] = 'none';
  };

  const gt = toGTNetwork(chain);
  if (!gt) {
    markUnsupported();
  } else {
    headers['x-gt-network'] = gt;
  }

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

    // Try Dexscreener (ds) first
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
        if (gt) {
          attempted.push('gt');
          const gtPoolsUrl = `${GT_API_BASE}/networks/${gt}/tokens/${address}/pools`;
          try {
            const gtPools = await fetchJson(gtPoolsUrl);
            gtArr = Array.isArray(gtPools?.data) ? gtPools.data : [];
          } catch (err) {
            logError('gt pools fetch failed', gtPoolsUrl, err);
          }
        } else {
          markUnsupported();
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
        if (!isValidAddress(poolAddr)) {
          continue;
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
          poolAddress: poolAddr as Address,
          pairAddress: p.pairAddress,
          liqUsd: liqUsd !== undefined ? Number(liqUsd) : undefined,
          gtSupported: isGtSupported(p.dexId, version),
          labels: Array.isArray(p.labels) ? p.labels : undefined,
          baseToken: p.baseToken ? {
            address: p.baseToken.address,
            symbol: p.baseToken.symbol,
            name: p.baseToken.name
          } : undefined,
          quoteToken: p.quoteToken ? {
            address: p.quoteToken.address,
            symbol: p.quoteToken.symbol,
            name: p.quoteToken.name
          } : undefined,
          info: p.info ? {
            imageUrl: p.info.imageUrl,
            header: p.info.header,
            openGraph: p.info.openGraph,
            description: p.info.description,
            websites: Array.isArray(p.info.websites) ? p.info.websites : undefined,
            socials: Array.isArray(p.info.socials) ? p.info.socials : undefined,
          } : undefined,
          priceUsd: p.priceUsd ? Number(p.priceUsd) : undefined,
          priceNative: p.priceNative ? Number(p.priceNative) : undefined,
          txns: p.txns ? {
            m5: p.txns.m5 ? { buys: p.txns.m5.buys || 0, sells: p.txns.m5.sells || 0 } : undefined,
            h1: p.txns.h1 ? { buys: p.txns.h1.buys || 0, sells: p.txns.h1.sells || 0 } : undefined,
            h6: p.txns.h6 ? { buys: p.txns.h6.buys || 0, sells: p.txns.h6.sells || 0 } : undefined,
            h24: p.txns.h24 ? { buys: p.txns.h24.buys || 0, sells: p.txns.h24.sells || 0 } : undefined,
          } : undefined,
          volume: p.volume ? {
            m5: p.volume.m5,
            h1: p.volume.h1,
            h6: p.volume.h6,
            h24: p.volume.h24,
          } : undefined,
          priceChange: p.priceChange ? {
            h1: p.priceChange.h1,
            h6: p.priceChange.h6,
            h24: p.priceChange.h24,
          } : undefined,
          liquidity: p.liquidity ? {
            usd: p.liquidity.usd,
            base: p.liquidity.base,
            quote: p.liquidity.quote,
          } : undefined,
          fdv: p.fdv,
          marketCap: p.marketCap,
          pairCreatedAt: p.pairCreatedAt,
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

    // Try GT provider
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
      if (!gt) {
        markUnsupported();
        headers['x-fallbacks-tried'] = attempted.join(',');
        const body: ApiError = { error: 'upstream_error', provider: 'none' };
        log('response', event.rawUrl, 500, 0, provider);
        return { statusCode: 500, headers, body: JSON.stringify(body) };
      }
      attempted.push('gt');
      const tokenUrl = `${GT_API_BASE}/networks/${gt}/tokens/${address}`;
      const poolsUrl = `${GT_API_BASE}/networks/${gt}/tokens/${address}/pools`;
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
        const poolAddr = attr.pool_address;
        if (!isValidAddress(poolAddr)) continue;
        pools.push({
          pairId: d.id,
          dex,
          version,
          base: attr.base_token?.symbol,
          quote: attr.quote_token?.symbol,
          chain: chain as string,
          poolAddress: poolAddr as Address,
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
};
