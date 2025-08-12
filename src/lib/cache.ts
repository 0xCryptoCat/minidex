import type { CacheSearchEntry, SearchResponse } from './types';

const searchCache = new Map<string, CacheSearchEntry>();
const TTL_SECONDS = 30;

export function getSearchCache(query: string): SearchResponse | undefined {
  const entry = searchCache.get(query);
  if (!entry) return undefined;
  const age = Math.floor(Date.now() / 1000) - entry.ts;
  if (age > TTL_SECONDS) {
    searchCache.delete(query);
    return undefined;
  }
  return entry.response;
}

export function setSearchCache(query: string, response: SearchResponse) {
  searchCache.set(query, { response, ts: Math.floor(Date.now() / 1000) });
}

