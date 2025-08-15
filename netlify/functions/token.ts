import type { Handler } from '@netlify/functions';
import type { TokenResponse, ApiError } from '../../src/lib/types';
import { isGtSupported } from '../shared/dex-allow';
import { toGTNetwork } from '../shared/chains';
import { getJson } from '../shared/http';

const CG_API_BASE = process.env.COINGECKO_API_BASE || '';
const CG_API_KEY = process.env.COINGECKO_API_KEY || '';
const rawDs = process.env.DS_API_BASE || 'https://api.dexscreener.com';
const dsBase = rawDs.replace(/\/+$/, '').replace(/\/latest$/, '');
const DEBUG = process.env.DEBUG_LOGS === 'true';

function log(...args: any[]) {
  if (DEBUG) console.log('[token]', ...args);
}

function logError(...args: any[]) {
  console.error('[token]', ...args);
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
      if (res.ok) return await res.json();
    } catch (err) {
      logError('cg token fetch failed', url, err);
      // try next
    }
  }
  throw new Error('cg_error');
}

export const handler: Handler = async (event) => {
  const chain = event.queryStringParameters?.chain;
  const address = event.queryStringParameters?.address;
  const SUPPORTED_CHAINS = new Set([
    'ethereum',
    'bsc',
    'polygon',
    'optimism',
    'arbitrum',
    'avalanche',
    'base',
  ]);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    'x-provider': 'none',
    'x-fallbacks-tried': '',
    'x-items': '0',
    'x-ds-info': 'missing',
  };
  const attempted: string[] = [];

  if (!isValidChain(chain) || !isValidAddress(address)) {
    const body: ApiError = { error: 'invalid_request', provider: 'none' };
    log('response', event.rawUrl, 400, 0, 'none');
    return { statusCode: 400, headers, body: JSON.stringify(body) };
  }
  if (!SUPPORTED_CHAINS.has(chain)) {
    const body: ApiError = { error: 'unsupported_network', provider: 'none' };
    log('response', event.rawUrl, 200, 0, 'none');
    return { statusCode: 200, headers, body: JSON.stringify(body) };
  }

  log('params', { chain, address });

  try {
    let info: any = undefined;
    let pools: any[] = [];
    let provider: 'ds' | 'cg' | undefined;
    const kpis: any = {};

    if (DS_API_BASE) {
      try {
        attempted.push('ds');
        const res = await fetch(`${dsBase}/token-pairs/v1/${chain}/${address.toLowerCase()}`);
        if (res.ok) {
          const ds = await res.json();
          info = ds.info;
          headers['x-ds-info'] = info ? 'present' : 'missing';
          pools = Array.isArray(ds.pairs)
            ? ds.pairs.map((p: any) => {
                const tx = p.txns || {};
                const mapTx = (t: any) =>
                  t ? { buys: Number(t.buys || 0), sells: Number(t.sells || 0) } : undefined;
                return {
                  pairId: p.pairId || p.pairAddress,
                  dex: p.dexId,
                  version: p.dexVersion || p.version,
                  chain,
                  pairAddress: p.pairAddress,
                  pairUrl: p.url,
                  baseToken: {
                    address: p.baseToken?.address,
                    symbol: p.baseToken?.symbol,
                    name: p.baseToken?.name,
                  },
                  quoteToken: {
                    address: p.quoteToken?.address,
                    symbol: p.quoteToken?.symbol,
                    name: p.quoteToken?.name,
                  },
                  priceNative:
                    p.priceNative !== undefined
                      ? Number(p.priceNative)
                      : p.price_native !== undefined
                      ? Number(p.price_native)
                      : undefined,
                  priceUsd:
                    p.priceUsd !== undefined
                      ? Number(p.priceUsd)
                      : p.price_usd !== undefined
                      ? Number(p.price_usd)
                      : undefined,
                  liquidity: {
                    usd:
                      p.liquidity?.usd !== undefined
                        ? Number(p.liquidity.usd)
                        : p.liquidityUsd !== undefined
                        ? Number(p.liquidityUsd)
                        : undefined,
                    base: p.liquidity?.base !== undefined ? Number(p.liquidity.base) : undefined,
                    quote: p.liquidity?.quote !== undefined ? Number(p.liquidity.quote) : undefined,
                  },
                  fdv: p.fdv !== undefined ? Number(p.fdv) : undefined,
                  marketCap: p.marketCap !== undefined ? Number(p.marketCap) : undefined,
                  labels: Array.isArray(p.labels) ? p.labels : undefined,
                  txns: {
                    m5: mapTx(tx.m5),
                    h1: mapTx(tx.h1),
                    h6: mapTx(tx.h6),
                    h24: mapTx(tx.h24),
                  },
                  volume: {
                    m5: p.volume?.m5 !== undefined ? Number(p.volume.m5) : undefined,
                    h1: p.volume?.h1 !== undefined ? Number(p.volume.h1) : undefined,
                    h6: p.volume?.h6 !== undefined ? Number(p.volume.h6) : undefined,
                    h24: p.volume?.h24 !== undefined ? Number(p.volume.h24) : undefined,
                  },
                  priceChange: {
                    m5: p.priceChange?.m5 !== undefined ? Number(p.priceChange.m5) : undefined,
                    h1: p.priceChange?.h1 !== undefined ? Number(p.priceChange.h1) : undefined,
                    h6: p.priceChange?.h6 !== undefined ? Number(p.priceChange.h6) : undefined,
                    h24: p.priceChange?.h24 !== undefined ? Number(p.priceChange.h24) : undefined,
                  },
                  pairCreatedAt: p.pairCreatedAt ? Number(p.pairCreatedAt) : undefined,
                  gtSupported: isGtSupported(p.dexId, p.dexVersion || p.version),
                };
              })
            : [];
          provider = 'ds';
          log('ds token');
        }

        if (!pools.length) {
          attempted.push('ds-search');
          const search = await getJson(`${dsBase}/latest/dex/search?q=${address}`);
          const list = Array.isArray(search?.pairs)
            ? search.pairs
            : Array.isArray(search)
            ? search
            : [];
          const match = list.find((p: any) => {
            const b = p.baseToken?.address?.toLowerCase();
            const q = p.quoteToken?.address?.toLowerCase();
            return b === address.toLowerCase() || q === address.toLowerCase();
          });
          if (match) {
            const tx = match.txns || {};
            const mapTx = (t: any) =>
              t ? { buys: Number(t.buys || 0), sells: Number(t.sells || 0) } : undefined;
            pools = [
              {
                pairId: match.pairId || match.pairAddress,
                dex: match.dexId,
                version: match.dexVersion || match.version,
                chain,
                pairAddress: match.pairAddress,
                pairUrl: match.url,
                baseToken: {
                  address: match.baseToken?.address,
                  symbol: match.baseToken?.symbol,
                  name: match.baseToken?.name,
                },
                quoteToken: {
                  address: match.quoteToken?.address,
                  symbol: match.quoteToken?.symbol,
                  name: match.quoteToken?.name,
                },
                priceNative: match.priceNative ? Number(match.priceNative) : undefined,
                priceUsd: match.priceUsd ? Number(match.priceUsd) : undefined,
                liquidity: {
                  usd: match.liquidityUsd ? Number(match.liquidityUsd) : undefined,
                  base: undefined,
                  quote: undefined,
                },
                fdv: match.fdv ? Number(match.fdv) : undefined,
                marketCap: match.marketCap ? Number(match.marketCap) : undefined,
                labels: Array.isArray(match.labels) ? match.labels : undefined,
                txns: {
                  m5: mapTx(tx.m5),
                  h1: mapTx(tx.h1),
                  h6: mapTx(tx.h6),
                  h24: mapTx(tx.h24),
                },
                volume: {
                  m5: match.volume?.m5 !== undefined ? Number(match.volume.m5) : undefined,
                  h1: match.volume?.h1 !== undefined ? Number(match.volume.h1) : undefined,
                  h6: match.volume?.h6 !== undefined ? Number(match.volume.h6) : undefined,
                  h24: match.volume?.h24 !== undefined ? Number(match.volume.h24) : undefined,
                },
                priceChange: {
                  m5: match.priceChange?.m5 !== undefined ? Number(match.priceChange.m5) : undefined,
                  h1: match.priceChange?.h1 !== undefined ? Number(match.priceChange.h1) : undefined,
                  h6: match.priceChange?.h6 !== undefined ? Number(match.priceChange.h6) : undefined,
                  h24: match.priceChange?.h24 !== undefined ? Number(match.priceChange.h24) : undefined,
                },
                pairCreatedAt: match.pairCreatedAt ? Number(match.pairCreatedAt) : undefined,
                gtSupported: isGtSupported(match.dexId, match.dexVersion || match.version),
              },
            ];
          }
        }
      } catch (err) {
        logError('ds token fetch failed', err);
      }
    }

    if (!pools.length) {
      const gtNet = toGTNetwork(chain);
      if (gtNet) {
        attempted.push('gt');
        try {
          const gt = await getJson(
            `https://api.geckoterminal.com/api/v2/networks/${gtNet}/tokens/${address.toLowerCase()}/pools`
          );
          const attrs = gt?.data?.[0]?.attributes;
          if (attrs) {
            info = info || {};
            info.baseToken = info.baseToken || { symbol: attrs.base_token_symbol };
            info.quoteToken = info.quoteToken || { symbol: attrs.quote_token_symbol };
          }
        } catch (err) {
          logError('gt token fetch failed', err);
        }
      }

      if (CG_API_BASE && CG_API_KEY) {
        attempted.push('cg-info');
        try {
          const cgInfo = await getJson(
            `${CG_API_BASE}/token-info-contract-address?chain=${chain}&address=${address.toLowerCase()}`,
            { headers: { 'x-cg-pro-api-key': CG_API_KEY } }
          );
          const attr = cgInfo?.data?.attributes || cgInfo?.data || cgInfo;
          if (attr) {
            info = info || {};
            if (!info.symbol && attr.symbol) info.symbol = attr.symbol;
            if (!info.name && attr.name) info.name = attr.name;
            if (!info.imageUrl && (attr.image || attr.logo || attr.image_url))
              info.imageUrl = attr.image || attr.logo || attr.image_url;
          }
        } catch (err) {
          logError('cg info fetch failed', err);
        }
      }
    }

    if (pools.length) {
      const first = pools[0];
      kpis.priceUsd = first.priceUsd;
      kpis.priceNative = first.priceNative;
      kpis.liqUsd = first.liquidity?.usd;
      kpis.fdvUsd = first.fdv;
      kpis.mcUsd = first.marketCap;
      kpis.priceChange24hPct = first.priceChange?.h24;
      if (first.pairCreatedAt) {
        const diff = Date.now() - Number(first.pairCreatedAt);
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        kpis.age = { days, hours };
      }
    }

    if (CG_API_BASE && CG_API_KEY) {
      attempted.push('cg');
      try {
        const cg = await fetchCgToken(chain, address);
        const attr = cg?.data?.attributes || cg?.data || cg;
        const priceChange = attr?.price_change_percentage || {};
        if (kpis.priceUsd === undefined && attr?.price_usd !== undefined)
          kpis.priceUsd = Number(attr.price_usd);
        if (kpis.mcUsd === undefined && attr?.market_cap_usd !== undefined)
          kpis.mcUsd = Number(attr.market_cap_usd);
        if (kpis.fdvUsd === undefined && attr?.fully_diluted_valuation_usd !== undefined)
          kpis.fdvUsd = Number(attr.fully_diluted_valuation_usd);
        if (kpis.priceChange24hPct === undefined && priceChange?.h24 !== undefined)
          kpis.priceChange24hPct = Number(priceChange.h24);
        if (!provider) provider = 'cg';
        log('cg token');
      } catch (err) {
        logError('cg token fetch failed', err);
      }
    }

    if (pools.length) {
      headers['x-provider'] = provider || 'none';
      headers['x-fallbacks-tried'] = attempted.join(',');
      headers['x-items'] = String(pools.length);
      const bodyRes: TokenResponse = {
        info,
        kpis,
        pools,
        provider: provider || 'cg',
      };
      log('response', event.rawUrl, 200, pools.length, provider || 'none');
      return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
    }

    headers['x-fallbacks-tried'] = attempted.join(',');
    headers['x-items'] = '0';
    const bodyRes: TokenResponse & { note: string } = {
      info: info || {},
      kpis: {},
      pools: [],
      provider: 'none',
      note: 'no_upstream_data',
    };
    log('response', event.rawUrl, 200, 0, 'none');
    return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
  } catch (err) {
    logError('handler error', err);
    headers['x-fallbacks-tried'] = attempted.join(',');
    const body: ApiError = { error: 'internal_error', provider: 'none' };
    return { statusCode: 500, headers, body: JSON.stringify(body) };
  }
};
