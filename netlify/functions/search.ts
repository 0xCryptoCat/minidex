import type { Handler } from '@netlify/functions';
import type { SearchResponse, ApiError, Provider } from '../../src/lib/types';
import fs from 'fs/promises';

const GT_FIXTURE = '../../fixtures/search-gt.json';
const DS_FIXTURE = '../../fixtures/search-ds.json';

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const DS_API_BASE = process.env.DS_API_BASE || '';
const GT_API_BASE = process.env.GT_API_BASE || '';

function isValidAddress(addr?: string): addr is string {
  return !!addr && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

async function readFixture(path: string): Promise<SearchResponse> {
  const url = new URL(path, import.meta.url);
  const data = await fs.readFile(url, 'utf8');
  return JSON.parse(data) as SearchResponse;
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
  const query =
    event.queryStringParameters?.query ||
    event.queryStringParameters?.address; // accept legacy "address" param
  const forceProvider = event.queryStringParameters?.provider as Provider | undefined;

  if (!isValidAddress(query)) {
    const body: ApiError = { error: 'invalid_address', provider: 'none' };
    return { statusCode: 400, body: JSON.stringify(body) };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
  };

  if (USE_FIXTURES) {
    try {
      if (forceProvider !== 'gt') {
        const ds = await readFixture(DS_FIXTURE);
        ds.query = query;
        return { statusCode: 200, headers, body: JSON.stringify(ds) };
      }
      throw new Error('force gt');
    } catch {
      try {
        const gt = await readFixture(GT_FIXTURE);
        gt.query = query;
        return { statusCode: 200, headers, body: JSON.stringify(gt) };
      } catch {
        const body: ApiError = { error: 'upstream_error', provider: 'none' };
        return { statusCode: 500, headers, body: JSON.stringify(body) };
      }
    }
  }

  try {
    if (forceProvider !== 'gt') {
      const ds = await fetchJson(`${DS_API_BASE}/dex/tokens/${query}`);
      if (!ds || Object.keys(ds).length === 0) throw new Error('empty');
      ds.provider = 'ds';
      ds.query = query;
      return { statusCode: 200, headers, body: JSON.stringify(ds) };
    }
    throw new Error('force gt');
  } catch {
    if (forceProvider === 'ds') {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
    try {
      const gt = await fetchJson(`${GT_API_BASE}/search/pairs?query=${query}`);
      if (!gt || Object.keys(gt).length === 0) throw new Error('empty');
      gt.provider = 'gt';
      gt.query = query;
      return { statusCode: 200, headers, body: JSON.stringify(gt) };
    } catch {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
  }
};

