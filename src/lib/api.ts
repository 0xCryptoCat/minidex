import type { SearchResponse, ApiError } from './types';
import { getSearchCache, setSearchCache } from './cache';

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

