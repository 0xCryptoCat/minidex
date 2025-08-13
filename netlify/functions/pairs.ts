import type { Handler } from '@netlify/functions';
import type { PairsResponse, ApiError, Provider } from '../../src/lib/types';
import fs from 'fs/promises';

const GT_FIXTURE = '../../fixtures/pairs-gt.json';

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const DS_API_BASE = process.env.DS_API_BASE || '';
const GT_API_BASE = process.env.GT_API_BASE || '';

function isValidAddress(addr?: string): addr is string {
  return !!addr && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function isValidChain(chain?: string): chain is string {
  return !!chain;
}

async function readFixture(path: string): Promise<PairsResponse> {
  const url = new URL(path, import.meta.url);
  const data = await fs.readFile(url, 'utf8');
  return JSON.parse(data) as PairsResponse;
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
  const address = event.queryStringParameters?.address;
  const forceProvider = event.queryStringParameters?.provider as Provider | undefined;

  if (!isValidChain(chain) || !isValidAddress(address)) {
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
        // No DS fixture; fall through to error to mimic real behavior
        throw new Error('no ds fixture');
      }
      throw new Error('force gt');
    } catch {
      try {
        const gt = await readFixture(GT_FIXTURE);
        return { statusCode: 200, headers, body: JSON.stringify(gt) };
      } catch {
        const body: ApiError = { error: 'upstream_error', provider: 'none' };
        return { statusCode: 500, headers, body: JSON.stringify(body) };
      }
    }
  }

  try {
    if (forceProvider !== 'gt') {
      const ds = await fetchJson(`${DS_API_BASE}/dex/tokens/${address}`);
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
      const gt = await fetchJson(`${GT_API_BASE}/networks/${chain}/tokens/${address}`);
      if (!gt || Object.keys(gt).length === 0) throw new Error('empty');
      gt.provider = 'gt';
      return { statusCode: 200, headers, body: JSON.stringify(gt) };
    } catch {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
  }
};

