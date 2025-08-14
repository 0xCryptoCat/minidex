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
  let ageDays: number | undefined;

  if (DS_API_BASE) {
    try {
      const res = await fetch(`${DS_API_BASE}/dex/tokens/${address}`);
      if (res.ok) {
        const ds = await res.json();
        const tokenMeta = ds.token || ds.pairs?.[0]?.baseToken || {};
        meta = {
          address: tokenMeta.address || address,
          symbol: tokenMeta.symbol || '',
          name: tokenMeta.name || '',
          icon: tokenMeta.icon || tokenMeta.imageUrl || undefined,
        };
        pairs = Array.isArray(ds.pairs)
          ? ds.pairs.map((p: any) => {
              if (!ageDays) {
                const created = p.pairCreatedAt || p.createdAt;
                if (created) {
                  ageDays = (Date.now() / 1000 - Number(created)) / 86400;
                }
              }
              return {
                pairId: p.pairId || p.pairAddress,
                dex: p.dexId,
                version: p.dexVersion || p.version,
                poolAddress: p.pairAddress,
                pairUrl: p.url,
                base: p.baseToken?.symbol,
                quote: p.quoteToken?.symbol,
              };
            })
          : [];
        const info = ds.token?.info || {};
        links.website = info.website || info.websites?.[0];
        links.twitter = info.twitter;
        links.telegram = info.telegram;
        links.explorer = info.explorer;
        log('ds token meta');
      }
    } catch {
      // ignore
    }
  }

  let core: any = null;
  let provider: 'cg' | 'ds' | undefined;

  if (CG_API_BASE && CG_API_KEY) {
    attempted.push('cg');
    try {
      const cg = await fetchCgToken(chain, address);
      const attr = cg?.data?.attributes || cg?.data || cg;
      const priceChange = attr?.price_change_percentage || {};
      core = {
        priceUsd: attr?.price_usd !== undefined ? Number(attr.price_usd) : undefined,
        mcUsd:
          attr?.market_cap_usd !== undefined ? Number(attr.market_cap_usd) : undefined,
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
      // ignore
    }
  }

  if (!core && DS_API_BASE) {
    attempted.push('ds');
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
          log('ds token metrics');
        }
      }
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

  if (meta && core) {
    headers['x-provider'] = provider || 'none';
    headers['x-fallbacks-tried'] = attempted.join(',');
    headers['x-items'] = String(pairs.length);
    const bodyRes: TokenResponse = {
      meta,
      kpis: { ...core, ageDays },
      links,
      pairs,
      provider: provider!,
    };
    log('response', event.rawUrl, 200, pairs.length, provider || 'none');
    return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
  }

  headers['x-fallbacks-tried'] = attempted.join(',');
  const body: ApiError = { error: 'upstream_error', provider: 'none' };
  log('response', event.rawUrl, 500, 0, provider || 'none');
  return { statusCode: 500, headers, body: JSON.stringify(body) };
};

