import type { SearchResponse, ApiError, PairsResponse, OHLCResponse, TradesResponse, Timeframe } from './types';
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
  setTradesCache(key, data);
  return data as TradesResponse;
}

