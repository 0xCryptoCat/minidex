import type {
  CacheSearchEntry,
  SearchResponse,
  CachePairsEntry,
  PairsResponse,
  CacheOHLCEntry,
  OHLCResponse,
  CacheTradesEntry,
  TradesResponse,
} from './types';

const searchCache = new Map<string, CacheSearchEntry>();
const pairsCache = new Map<string, CachePairsEntry>();
const ohlcCache = new Map<string, CacheOHLCEntry>();
const tradesCache = new Map<string, CacheTradesEntry>();

const TTL_SECONDS = 30;
const MAX_ENTRIES = 50;

function now(): number {
  return Math.floor(Date.now() / 1000);
}

function getMapEntry<T>(map: Map<string, { response: T; ts: number }>, key: string): T | undefined {
  let entry = map.get(key);
  if (!entry && typeof sessionStorage !== 'undefined') {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      try {
        entry = JSON.parse(raw) as { response: T; ts: number };
        map.set(key, entry);
      } catch {
        sessionStorage.removeItem(key);
      }
    }
  }
  if (!entry) return undefined;
  const age = now() - entry.ts;
  if (age > TTL_SECONDS) {
    map.delete(key);
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key);
    return undefined;
  }
  return entry.response;
}

function setMapEntry<T>(map: Map<string, { response: T; ts: number }>, key: string, response: T) {
  const entry = { response, ts: now() };
  map.set(key, entry);
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch {
      /* ignore */
    }
  }
  if (map.size > MAX_ENTRIES) {
    const oldestKey = map.keys().next().value as string | undefined;
    if (oldestKey) {
      map.delete(oldestKey);
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(oldestKey);
    }
  }
}

// Search
export function getSearchCache(query: string): SearchResponse | undefined {
  return getMapEntry(searchCache, `search:${query}`);
}
export function setSearchCache(query: string, response: SearchResponse) {
  setMapEntry(searchCache, `search:${query}`, response);
}

// Pairs
export function getPairsCache(key: string): PairsResponse | undefined {
  return getMapEntry(pairsCache, `pairs:${key}`);
}
export function setPairsCache(key: string, response: PairsResponse) {
  setMapEntry(pairsCache, `pairs:${key}`, response);
}

// OHLC
export function getOHLCCache(key: string): OHLCResponse | undefined {
  return getMapEntry(ohlcCache, `ohlc:${key}`);
}
export function setOHLCCache(key: string, response: OHLCResponse) {
  setMapEntry(ohlcCache, `ohlc:${key}`, response);
}

// Trades
export function getTradesCache(key: string): TradesResponse | undefined {
  return getMapEntry(tradesCache, `trades:${key}`);
}
export function setTradesCache(key: string, response: TradesResponse) {
  setMapEntry(tradesCache, `trades:${key}`, response);
}

