import type { Handler } from '@netlify/functions';
import type { OHLCResponse, ApiError, Provider, Timeframe } from '../../src/lib/types';
import fs from 'fs/promises';

const GT_FIXTURE = '../../fixtures/ohlc-gt-1m.json';
const DS_FIXTURE = '../../fixtures/ohlc-ds-1m.json';

function isValidPair(id?: string): id is string {
  return !!id;
}

function isValidTf(tf?: string): tf is Timeframe {
  return !!tf;
}

async function readFixture(path: string): Promise<OHLCResponse> {
  const data = await fs.readFile(path, 'utf8');
  return JSON.parse(data) as OHLCResponse;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
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

  try {
    if (forceProvider !== 'ds') {
      const gt = await withTimeout(readFixture(GT_FIXTURE), 3000);
      gt.pairId = pairId;
      if (tf !== '1m') {
        gt.rollupHint = 'client';
      }
      return { statusCode: 200, headers, body: JSON.stringify(gt) };
    }
    throw new Error('forced ds');
  } catch {
    try {
      const ds = await withTimeout(readFixture(DS_FIXTURE), 3000);
      ds.pairId = pairId;
      if (tf !== '1m') {
        ds.rollupHint = 'client';
      }
      return { statusCode: 200, headers, body: JSON.stringify(ds) };
    } catch {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
  }
};

