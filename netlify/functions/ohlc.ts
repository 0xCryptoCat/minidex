import type { Handler } from '@netlify/functions';
import type { OHLCResponse, ApiError, Provider, Timeframe } from '../../src/lib/types';
import fs from 'fs/promises';

const GT_FIXTURE = '../../fixtures/ohlc-gt-1m.json';
const DS_FIXTURE = '../../fixtures/ohlc-ds-1m.json';

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const DS_API_BASE = process.env.DS_API_BASE || '';
const GT_API_BASE = process.env.GT_API_BASE || '';

function isValidPair(id?: string): id is string {
  return !!id;
}

function isValidTf(tf?: string): tf is Timeframe {
  return !!tf;
}

async function readFixture(path: string): Promise<OHLCResponse> {
  const url = new URL(path, import.meta.url);
  const data = await fs.readFile(url, 'utf8');
  return JSON.parse(data) as OHLCResponse;
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
  const pairId = event.queryStringParameters?.pairId;
  const tf = event.queryStringParameters?.tf as Timeframe | undefined;
  const forceProvider = event.queryStringParameters?.provider as Provider | undefined;

  if (!isValidPair(pairId) || !isValidTf(tf)) {
    const body: ApiError = { error: 'invalid_request', provider: 'none' };
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
        ds.pairId = pairId;
        if (tf !== '1m') {
          ds.rollupHint = 'client';
        }
        return { statusCode: 200, headers, body: JSON.stringify(ds) };
      }
      throw new Error('force gt');
    } catch {
      try {
        const gt = await readFixture(GT_FIXTURE);
        gt.pairId = pairId;
        if (tf !== '1m') {
          gt.rollupHint = 'client';
        }
        return { statusCode: 200, headers, body: JSON.stringify(gt) };
      } catch {
        const body: ApiError = { error: 'upstream_error', provider: 'none' };
        return { statusCode: 500, headers, body: JSON.stringify(body) };
      }
    }
  }

  try {
    if (forceProvider !== 'gt') {
      const ds = await fetchJson(`${DS_API_BASE}/dex/pairs/${pairId}/candles?timeframe=${tf}`);
      if (!ds || Object.keys(ds).length === 0) throw new Error('empty');
      ds.provider = 'ds';
      return { statusCode: 200, headers, body: JSON.stringify(ds) };
    }
    throw new Error('force gt');
  } catch {
    if (forceProvider === 'ds') {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
    try {
      const gt = await fetchJson(`${GT_API_BASE}/pools/${pairId}/ohlcv/${tf}`);
      if (!gt || Object.keys(gt).length === 0) throw new Error('empty');
      gt.provider = 'gt';
      return { statusCode: 200, headers, body: JSON.stringify(gt) };
    } catch {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
  }
};

