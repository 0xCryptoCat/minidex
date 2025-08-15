import type {
  SearchResponse,
  ApiError,
  PairsResponse,
  OHLCResponse,
  TradesResponse,
  Timeframe,
  ListsResponse,
  ListType,
  Window,
  TokenResponse,
  ApiResult,
  FetchMeta,
} from './types';
import {
  getSearchCache,
  setSearchCache,
  getPairsCache,
  setPairsCache,
  getOHLCCache,
  setOHLCCache,
  getTradesCache,
  setTradesCache,
  getTokenCache,
  setTokenCache,
} from './cache';

const BASE = '/.netlify/functions';

const EMPTY_META: FetchMeta = {
  provider: 'none',
  tried: null,
  effectiveTf: null,
  remapped: null,
  items: null,
  token: null,
  priceSource: null,
  invalidPool: null,
  cgAuth: null,
};

function readMeta(res: Response): FetchMeta {
  return {
    provider: res.headers.get('x-provider'),
    tried: res.headers.get('x-fallbacks-tried'),
    effectiveTf: res.headers.get('x-effective-tf'),
    remapped: res.headers.get('x-remapped-pool'),
    items: res.headers.get('x-items'),
    token: res.headers.get('x-token'),
    priceSource: res.headers.get('x-price-source'),
    invalidPool: res.headers.get('x-invalid-pool'),
    cgAuth: res.headers.get('x-cg-auth'),
  };
}

export async function search(
  query: string,
  provider?: string
): Promise<ApiResult<SearchResponse | ApiError>> {
  const cached = getSearchCache(query);
  if (cached) return cached;

  const url = new URL(`${BASE}/search`, window.location.origin);
  url.searchParams.set('query', query);
  if (provider) url.searchParams.set('provider', provider);
  try {
    const res = await fetch(url.toString());
    const json = await res.json();
    const meta = readMeta(res);
    if (!res.ok) {
      const data: ApiError =
        res.status === 429
          ? { error: 'rate_limit', provider: 'none' }
          : json.error
          ? json
          : { error: 'upstream_error', provider: 'none' };
      return { data, meta };
    }
    const data = json as SearchResponse;
    setSearchCache(query, { data, meta });
    return { data, meta };
  } catch {
    return { data: { error: 'upstream_error', provider: 'none' }, meta: EMPTY_META };
  }
}

export async function pairs(
  chain: string,
  address: string,
  provider?: string
): Promise<ApiResult<PairsResponse | ApiError>> {
  const key = `${chain}:${address}`;
  const cached = getPairsCache(key);
  if (cached) return cached;

  const url = new URL(`${BASE}/pairs`, window.location.origin);
  url.searchParams.set('chain', chain);
  url.searchParams.set('address', address);
  if (provider) url.searchParams.set('provider', provider);

  const res = await fetch(url.toString());
  const json = await res.json();
  const meta = readMeta(res);
  if (res.ok) {
    const data = json as PairsResponse;
    setPairsCache(key, { data, meta });
    return { data, meta };
  }
  const data: ApiError = json.error ? json : { error: 'upstream_error', provider: 'none' };
  return { data, meta };
}

export async function ohlc(params: {
  pairId: string;
  poolAddress: string;
  chain: string;
  tf: Timeframe;
  provider?: string;
}): Promise<ApiResult<OHLCResponse>> {
  const { pairId, poolAddress, chain, tf, provider } = params;
  const key = `${chain}:${pairId}:${poolAddress}:${tf}`;
  const cached = getOHLCCache(key);
  if (cached) return cached;

  const url = new URL(`${BASE}/ohlc`, window.location.origin);
  url.searchParams.set('pairId', pairId);
  url.searchParams.set('chain', chain);
  url.searchParams.set('poolAddress', poolAddress);
  url.searchParams.set('tf', tf);
  if (provider) url.searchParams.set('provider', provider);

  const res = await fetch(url.toString());
  const json = await res.json();
  const meta = readMeta(res);
  if (!res.ok) {
    const err: any = new Error('api error');
    err.status = res.status;
    throw err;
  }
  if (!Array.isArray((json as any).candles)) {
    (json as any).candles = [];
  }
  const data = json as OHLCResponse;
  setOHLCCache(key, { data, meta });
  return { data, meta };
}

export async function trades(params: {
  pairId: string;
  poolAddress: string;
  chain: string;
  tokenAddress?: string;
  limit?: number;
  window?: number;
  provider?: string;
}): Promise<ApiResult<TradesResponse>> {
  const { pairId, poolAddress, chain, tokenAddress, provider, limit, window: windowH } = params;
  const key = `${chain}:${pairId}:${poolAddress}:${tokenAddress || ''}`;
  const cached = getTradesCache(key);
  if (cached) return cached;

  const url = new URL(`${BASE}/trades`, window.location.origin);
  url.searchParams.set('pairId', pairId);
  url.searchParams.set('chain', chain);
  url.searchParams.set('poolAddress', poolAddress);
  if (tokenAddress) url.searchParams.set('token', tokenAddress);
  if (provider) url.searchParams.set('provider', provider);
  if (limit) url.searchParams.set('limit', String(limit));
  if (windowH) url.searchParams.set('window', String(windowH));

  const res = await fetch(url.toString());
  const json = await res.json();
  const meta = readMeta(res);
  if (!res.ok) {
    const err: any = new Error('api error');
    err.status = res.status;
    throw err;
  }
  if (!Array.isArray((json as any).trades)) {
    (json as any).trades = [];
  }
  const data = json as TradesResponse;
  setTradesCache(key, { data, meta });
  return { data, meta };
}

export async function token(
  chain: string,
  address: string
): Promise<ApiResult<TokenResponse | ApiError>> {
  const key = `${chain}:${address}`;
  const cached = getTokenCache(key);
  if (cached) return cached;

  const url = new URL(`${BASE}/token`, window.location.origin);
  url.searchParams.set('chain', chain);
  url.searchParams.set('address', address);

  try {
    const res = await fetch(url.toString());
    const json = await res.json();
    const meta = readMeta(res);
    if (!res.ok) {
      const data: ApiError = json.error
        ? json
        : { error: 'upstream_error', provider: 'none' };
      return { data, meta };
    }
    const data = json as TokenResponse;
    setTokenCache(key, { data, meta });
    return { data, meta };
  } catch {
    return { data: { error: 'upstream_error', provider: 'none' }, meta: EMPTY_META };
  }
}

export async function lists(
  params: { chain: string; type: ListType; window: Window; limit?: number }
): Promise<ApiResult<ListsResponse | ApiError>> {
  const url = new URL(`${BASE}/lists`, window.location.origin);
  url.searchParams.set('chain', params.chain);
  url.searchParams.set('type', params.type);
  url.searchParams.set('window', params.window);
  if (params.limit) url.searchParams.set('limit', params.limit.toString());
  try {
    const res = await fetch(url.toString());
    const json = await res.json();
    const meta = readMeta(res);
    if (!res.ok) {
      const data: ApiError = json.error
        ? json
        : { error: 'upstream_error', provider: 'none' };
      return { data, meta };
    }
    const data = json as ListsResponse;
    return { data, meta };
  } catch {
    return { data: { error: 'upstream_error', provider: 'none' }, meta: EMPTY_META };
  }
}

