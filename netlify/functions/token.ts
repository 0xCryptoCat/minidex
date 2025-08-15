import type { Handler } from '@netlify/functions';
import type { TokenResponse, ApiError } from '../../src/lib/types';
import { isGtSupported } from '../shared/dex-allow';

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

  let meta: any = null;
  let pairs: any[] = [];
  const links: any = {};
  let imageUrl: string | undefined;
  let headerUrl: string | undefined;
  let description: string | undefined;
  let websites: any[] | undefined;
  let socials: any[] | undefined;
  let ageSec: number | undefined;
  let provider: 'cg' | 'ds' | undefined;
  const kpis: any = {};

  if (DS_API_BASE) {
    try {
      attempted.push('ds');
      const res = await fetch(`${DS_API_BASE}/token-pairs/v1/${chain}/${address}`);
      if (res.ok) {
        const ds = await res.json();
        const tokenMeta = ds.pairs?.[0]?.baseToken || {};
        meta = {
          address: tokenMeta.address || address,
          symbol: tokenMeta.symbol || '',
          name: tokenMeta.name || '',
          icon: tokenMeta.imageUrl || undefined,
        };
        pairs = Array.isArray(ds.pairs)
          ? ds.pairs.map((p: any) => {
              const tx = p.txns || {};
              const mapped: any = {
                pairId: p.pairId || p.pairAddress,
                dex: p.dexId,
                version: p.dexVersion || p.version,
                poolAddress: p.pairAddress,
                pairUrl: p.url,
                base: p.baseToken?.symbol,
                quote: p.quoteToken?.symbol,
                liqUsd:
                  p.liquidity?.usd !== undefined
                    ? Number(p.liquidity.usd)
                    : p.liquidityUsd !== undefined
                    ? Number(p.liquidityUsd)
                    : undefined,
                liquidity: {
                  base: p.liquidity?.base !== undefined ? Number(p.liquidity.base) : undefined,
                  quote: p.liquidity?.quote !== undefined ? Number(p.liquidity.quote) : undefined,
                  usd:
                    p.liquidity?.usd !== undefined
                      ? Number(p.liquidity.usd)
                      : p.liquidityUsd !== undefined
                      ? Number(p.liquidityUsd)
                      : undefined,
                },
                fdv: p.fdv !== undefined ? Number(p.fdv) : undefined,
                marketCap: p.marketCap !== undefined ? Number(p.marketCap) : undefined,
                labels: Array.isArray(p.labels) ? p.labels : undefined,
                priceUsd:
                  p.priceUsd !== undefined
                    ? Number(p.priceUsd)
                    : p.price_usd !== undefined
                    ? Number(p.price_usd)
                    : undefined,
                priceNative:
                  p.priceNative !== undefined
                    ? Number(p.priceNative)
                    : p.price_native !== undefined
                    ? Number(p.price_native)
                    : undefined,
                txns: {
                  m5:
                    tx.m5 !== undefined
                      ? Number((tx.m5?.buys || 0) + (tx.m5?.sells || 0))
                      : undefined,
                  h1:
                    tx.h1 !== undefined
                      ? Number((tx.h1?.buys || 0) + (tx.h1?.sells || 0))
                      : undefined,
                  h6:
                    tx.h6 !== undefined
                      ? Number((tx.h6?.buys || 0) + (tx.h6?.sells || 0))
                      : undefined,
                  h24:
                    tx.h24 !== undefined
                      ? Number((tx.h24?.buys || 0) + (tx.h24?.sells || 0))
                      : undefined,
                },
                volume: {
                  m5: p.volume?.m5 !== undefined ? Number(p.volume.m5) : undefined,
                  h1: p.volume?.h1 !== undefined ? Number(p.volume.h1) : undefined,
                  h6: p.volume?.h6 !== undefined ? Number(p.volume.h6) : undefined,
                  h24: p.volume?.h24 !== undefined ? Number(p.volume.h24) : undefined,
                },
                priceChange: {
                  m5:
                    p.priceChange?.m5 !== undefined
                      ? Number(p.priceChange.m5)
                      : undefined,
                  h1:
                    p.priceChange?.h1 !== undefined
                      ? Number(p.priceChange.h1)
                      : undefined,
                  h6:
                    p.priceChange?.h6 !== undefined
                      ? Number(p.priceChange.h6)
                      : undefined,
                  h24:
                    p.priceChange?.h24 !== undefined
                      ? Number(p.priceChange.h24)
                      : undefined,
                },
                pairCreatedAt: p.pairCreatedAt || p.createdAt,
                gtSupported: isGtSupported(p.dexId, p.dexVersion || p.version),
              };
              return mapped;
            })
          : [];
        const info = ds.info || {};
        imageUrl = info.imageUrl;
        headerUrl = info.header;
        description = info.description;
        websites = info.websites;
        socials = info.socials;
        const created = pairs.reduce((min: number, p: any) => {
          return p.pairCreatedAt && p.pairCreatedAt < min ? p.pairCreatedAt : min;
          }, Number.MAX_SAFE_INTEGER);
        if (created !== Number.MAX_SAFE_INTEGER) {
          ageSec = Math.max(0, Math.floor(Date.now() / 1000 - created));
        }
        provider = 'ds';
        log('ds token meta');
      }
    } catch {
      // ignore
    }
  }

  if (pairs.length) {
    const first = pairs[0];
    kpis.priceUsd = first.priceUsd;
    kpis.mcUsd = first.marketCap;
    kpis.fdvUsd = first.fdv;
    kpis.liqUsd = pairs.reduce(
      (sum: number, p: any) => sum + (p.liquidity?.usd || p.liqUsd || 0),
      0
    );
    kpis.vol24hUsd = pairs.reduce(
      (sum: number, p: any) => sum + (p.volume?.h24 || 0),
      0
    );
    kpis.priceChange24hPct = first.priceChange?.h24;
  }
  if (ageSec !== undefined) {
    kpis.ageDays = ageSec / 86400;
    kpis.ageHours = ageSec / 3600;
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
      if (kpis.liqUsd === undefined && attr?.liquidity_usd !== undefined)
        kpis.liqUsd = Number(attr.liquidity_usd);
      if (kpis.vol24hUsd === undefined && attr?.volume_24h_usd !== undefined)
        kpis.vol24hUsd = Number(attr.volume_24h_usd);
      if (kpis.priceChange24hPct === undefined && priceChange?.h24 !== undefined)
        kpis.priceChange24hPct = Number(priceChange.h24);
      if (!meta) {
        meta = {
          address,
          symbol: attr?.symbol || '',
          name: attr?.name || '',
          icon: attr?.image_url || undefined,
        };
      }
      if (!provider) provider = 'cg';
      log('cg token');
    } catch {
      // ignore
    }
  }

  if (!links.explorer) {
    const EXPLORER: Record<string, string> = {
      ethereum: 'https://etherscan.io/token/{addr}',
      arbitrum: 'https://arbiscan.io/token/{addr}',
      polygon: 'https://polygonscan.com/token/{addr}',
      bsc: 'https://bscscan.com/token/{addr}',
      base: 'https://basescan.org/token/{addr}',
      optimism: 'https://optimistic.etherscan.io/token/{addr}',
      avalanche: 'https://snowtrace.io/token/{addr}',
    };
    if (EXPLORER[chain]) {
      links.explorer = EXPLORER[chain].replace('{addr}', address);
    }
  }

  if (meta) {
    headers['x-provider'] = provider || 'none';
    headers['x-fallbacks-tried'] = attempted.join(',');
    headers['x-items'] = String(pairs.length);
    const bodyRes: TokenResponse = {
      meta,
      imageUrl,
      headerUrl,
      description,
      websites,
      socials,
      kpis,
      links,
      pairs,
      provider: provider || 'cg',
    };
    log('response', event.rawUrl, 200, pairs.length, provider || 'none');
    return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
  }

  headers['x-fallbacks-tried'] = attempted.join(',');
  const body: ApiError = { error: 'upstream_error', provider: 'none' };
  log('response', event.rawUrl, 500, 0, provider || 'none');
  return { statusCode: 500, headers, body: JSON.stringify(body) };
};

