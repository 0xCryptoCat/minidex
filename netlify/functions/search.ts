import type { Handler } from '@netlify/functions';
import type { SearchResponse, ApiError, Provider } from '../../src/lib/types';
import fs from 'fs/promises';

const GT_FIXTURE = '../../fixtures/search-gt.json';
const DS_FIXTURE = '../../fixtures/search-ds.json';

function isValidAddress(addr?: string): addr is string {
  return !!addr && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

async function readFixture(path: string): Promise<SearchResponse> {
  const data = await fs.readFile(path, 'utf8');
  return JSON.parse(data) as SearchResponse;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export const handler: Handler = async (event) => {
  const query = event.queryStringParameters?.query;
  const forceProvider = event.queryStringParameters?.provider as Provider | undefined;

  if (!isValidAddress(query)) {
    const body: ApiError = { error: 'invalid_address', provider: 'none' };
    return { statusCode: 400, body: JSON.stringify(body) };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
  };

  try {
    if (forceProvider !== 'ds') {
      const gt = await withTimeout(readFixture(GT_FIXTURE), 3000);
      gt.query = query;
      return { statusCode: 200, headers, body: JSON.stringify(gt) };
    }
    throw new Error('forced ds');
  } catch {
    try {
      const ds = await withTimeout(readFixture(DS_FIXTURE), 3000);
      ds.query = query;
      return { statusCode: 200, headers, body: JSON.stringify(ds) };
    } catch {
      const body: ApiError = { error: 'upstream_error', provider: 'none' };
      return { statusCode: 500, headers, body: JSON.stringify(body) };
    }
  }
};

