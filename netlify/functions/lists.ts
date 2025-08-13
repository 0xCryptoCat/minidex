import type { Handler } from '@netlify/functions';
import type { ListsResponse, ApiError, ListType, Window } from '../../src/lib/types';
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
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
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
      ds.provider = 'ds';
      return { statusCode: 200, headers, body: JSON.stringify(ds) };
    }
    throw new Error('empty');
  } catch {
    try {
      const gtUrl = `${GT_API_BASE}/networks/${chain}/${type}?window=${window}${limit ? `&limit=${limit}` : ''}`;
      const gt = await fetchJson(gtUrl);
      if (!gt || Object.keys(gt).length === 0) throw new Error('empty');
      gt.provider = 'gt';
      return { statusCode: 200, headers, body: JSON.stringify(gt) };
    } catch {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
  }
};
