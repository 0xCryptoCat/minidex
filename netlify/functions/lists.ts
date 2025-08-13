import type { Handler } from '@netlify/functions';
import type {
  ListsResponse,
  ApiError,
  ListType,
  Window,
  ListItem,
} from '../../src/lib/types';
import fs from 'fs/promises';

const FIXTURES: Record<string, string> = {
  'trending:ethereum:1h': '../../fixtures/lists-trending-eth-1h.json',
  'discovery:ethereum:1d': '../../fixtures/lists-discovery-eth-1d.json',
  'leaderboard:ethereum:1d': '../../fixtures/lists-leaderboard-eth-1d.json',
};

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const DS_API_BASE = process.env.DS_API_BASE || '';
const GT_API_BASE = process.env.GT_API_BASE || '';

function isValidType(t?: string): t is ListType {
  return t === 'trending' || t === 'discovery' || t === 'leaderboard';
}
function isValidWindow(w?: string): w is Window {
  return w === '1h' || w === '1d' || w === '1w';
}
function isValidChain(c?: string): c is string {
  return !!c;
}

async function readFixture(path: string): Promise<ListsResponse> {
  const url = new URL(path, import.meta.url);
  const data = await fs.readFile(url, 'utf8');
  return JSON.parse(data) as ListsResponse;
}

async function fetchJson(url: string): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('status');
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

function rank(items: ListItem[]): void {
  let maxVol = 0;
  let maxPrice = 0;
  let maxTrades = 0;
  for (const it of items) {
    if (it.volWindowUsd && it.volWindowUsd > maxVol) maxVol = it.volWindowUsd;
    if (it.priceChangePct !== undefined) {
      const p = Math.abs(it.priceChangePct);
      if (p > maxPrice) maxPrice = p;
    }
    if (it.tradesWindow && it.tradesWindow > maxTrades) maxTrades = it.tradesWindow;
  }
  for (const it of items) {
    const volScore = maxVol ? (it.volWindowUsd || 0) / maxVol : 0;
    const priceScore = maxPrice ? Math.abs(it.priceChangePct || 0) / maxPrice : 0;
    const tradeScore = maxTrades ? (it.tradesWindow || 0) / maxTrades : 0;
    it.score = 0.5 * volScore + 0.3 * priceScore + 0.2 * tradeScore;
  }
  items.sort((a, b) => {
    const diff = (b.score || 0) - (a.score || 0);
    if (diff !== 0) return diff;
    return a.pairId.localeCompare(b.pairId);
  });
}

export const handler: Handler = async (event) => {
  const chain = event.queryStringParameters?.chain;
  const type = event.queryStringParameters?.type as ListType | undefined;
  const window = event.queryStringParameters?.window as Window | undefined;
  const limitParam = event.queryStringParameters?.limit;
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  if (!isValidChain(chain) || !isValidType(type) || !isValidWindow(window)) {
    const body: ApiError = { error: 'invalid_request', provider: 'none' };
    return { statusCode: 400, body: JSON.stringify(body) };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
  };

  const key = `${type}:${chain}:${window}`;
  if (USE_FIXTURES) {
    const path = FIXTURES[key];
    if (!path) {
      const body: ApiError = { error: 'not_found', provider: 'none' };
      return { statusCode: 404, headers, body: JSON.stringify(body) };
    }
    try {
      const data = await readFixture(path);
      rank(data.items);
      if (limit !== undefined) data.items = data.items.slice(0, limit);
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
  }

  try {
    const dsUrl = `${DS_API_BASE}/lists/${type}?chain=${chain}&window=${window}${limit ? `&limit=${limit}` : ''}`;
    const ds = await fetchJson(dsUrl);
    if (ds && Object.keys(ds).length) {
      rank(ds.items || []);
      if (limit !== undefined) ds.items = ds.items.slice(0, limit);
      ds.provider = 'ds';
      return { statusCode: 200, headers, body: JSON.stringify(ds) };
    }
    throw new Error('empty');
  } catch {
    try {
      const gtUrl = `${GT_API_BASE}/networks/${chain}/${type}?window=${window}${limit ? `&limit=${limit}` : ''}`;
      const gt = await fetchJson(gtUrl);
      if (!gt || Object.keys(gt).length === 0) throw new Error('empty');
      rank(gt.items || []);
      if (limit !== undefined) gt.items = gt.items.slice(0, limit);
      gt.provider = 'gt';
      return { statusCode: 200, headers, body: JSON.stringify(gt) };
    } catch {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
  }
};
