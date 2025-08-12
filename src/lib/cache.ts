import type { CacheSearchEntry, SearchResponse, CachePairsEntry, PairsResponse } from './types';

const searchCache = new Map<string, CacheSearchEntry>();
const pairsCache = new Map<string, CachePairsEntry>();
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

export function getPairsCache(key: string): PairsResponse | undefined {
  const entry = pairsCache.get(key);
  if (!entry) return undefined;
  const age = Math.floor(Date.now() / 1000) - entry.ts;
  if (age > TTL_SECONDS) {
    pairsCache.delete(key);
    return undefined;
  }
  return entry.response;
}

export function setPairsCache(key: string, response: PairsResponse) {
  pairsCache.set(key, { response, ts: Math.floor(Date.now() / 1000) });
}

