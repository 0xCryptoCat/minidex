import type { SearchResponse, ApiError, PairsResponse } from './types';
import { getSearchCache, setSearchCache, getPairsCache, setPairsCache } from './cache';

const BASE = '/.netlify/functions';

export async function search(query: string, provider?: string): Promise<SearchResponse | ApiError> {
  const cached = getSearchCache(query);
  if (cached) return cached;

  const url = new URL(`${BASE}/search`, window.location.origin);
  url.searchParams.set('query', query);
  if (provider) url.searchParams.set('provider', provider);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (res.ok) setSearchCache(query, data);
  return data;
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

