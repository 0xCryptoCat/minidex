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
} from './cache';

const BASE = '/.netlify/functions';

export async function search(query: string, provider?: string): Promise<SearchResponse | ApiError> {
  const cached = getSearchCache(query);
  if (cached) return cached;

  const url = new URL(`${BASE}/search`, window.location.origin);
  url.searchParams.set('query', query);
  if (provider) url.searchParams.set('provider', provider);
  try {
    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 429) {
        return { error: 'rate_limit', provider: 'none' };
      }
      return data.error ? data : { error: 'upstream_error', provider: 'none' };
    }
    setSearchCache(query, data);
    return data;
  } catch {
    return { error: 'upstream_error', provider: 'none' };
  }
}

export async function pairs(
  chain: string,
  address: string,
  provider?: string
): Promise<PairsResponse | ApiError> {
  const key = `${chain}:${address}`;
  const cached = getPairsCache(key);
  if (cached) return cached;

  const url = new URL(`${BASE}/pairs`, window.location.origin);
  url.searchParams.set('chain', chain);
  url.searchParams.set('address', address);
  if (provider) url.searchParams.set('provider', provider);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (res.ok) setPairsCache(key, data);
  return data;
}

export async function ohlc(
  pairId: string,
  tf: Timeframe,
  provider?: string
): Promise<OHLCResponse> {
  const key = `${pairId}:${tf}`;
  const cached = getOHLCCache(key);
  if (cached) return cached;

  const url = new URL(`${BASE}/ohlc`, window.location.origin);
  url.searchParams.set('pairId', pairId);
  url.searchParams.set('tf', tf);
  if (provider) url.searchParams.set('provider', provider);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok) {
    const err: any = new Error('api error');
    err.status = res.status;
    throw err;
  }
  if (!Array.isArray((data as any).candles)) {
    (data as any).candles = [];
  }
  setOHLCCache(key, data);
  return data as OHLCResponse;
}

export async function trades(pairId: string, provider?: string): Promise<TradesResponse> {
  const key = pairId;
  const cached = getTradesCache(key);
  if (cached) return cached;

  const url = new URL(`${BASE}/trades`, window.location.origin);
  url.searchParams.set('pairId', pairId);
  if (provider) url.searchParams.set('provider', provider);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok) {
    const err: any = new Error('api error');
    err.status = res.status;
    throw err;
  }
  if (!Array.isArray((data as any).trades)) {
    (data as any).trades = [];
  }
  setTradesCache(key, data);
  return data as TradesResponse;
}

export async function lists(
  params: { chain: string; type: ListType; window: Window; limit?: number }
): Promise<ListsResponse | ApiError> {
  const url = new URL(`${BASE}/lists`, window.location.origin);
  url.searchParams.set('chain', params.chain);
  url.searchParams.set('type', params.type);
  url.searchParams.set('window', params.window);
  if (params.limit) url.searchParams.set('limit', params.limit.toString());
  try {
    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok) {
      return data.error ? data : { error: 'upstream_error', provider: 'none' };
    }
    return data as ListsResponse;
  } catch {
    return { error: 'upstream_error', provider: 'none' };
  }
}

