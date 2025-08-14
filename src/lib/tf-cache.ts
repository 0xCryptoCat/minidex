import type { Timeframe, Provider } from './types';

const CACHE_KEY = 'tf-cache';

function getStore(): Record<string, Timeframe> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Timeframe>) : {};
  } catch {
    return {};
  }
}

function setStore(store: Record<string, Timeframe>) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function getCachedTf(pairId: string, provider: Provider): Timeframe | undefined {
  const key = `${pairId}:${provider}`;
  const store = getStore();
  return store[key];
}

export function setCachedTf(pairId: string, provider: Provider, tf: Timeframe) {
  const key = `${pairId}:${provider}`;
  const store = getStore();
  store[key] = tf;
  setStore(store);
}
