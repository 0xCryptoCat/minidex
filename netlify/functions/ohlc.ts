import type { Handler } from '@netlify/functions';
import type { OHLCResponse, ApiError, Provider, Timeframe } from '../../src/lib/types';
import fs from 'fs/promises';

const GT_FIXTURE = '../../fixtures/ohlc-gt-1m.json';
const DS_FIXTURE = '../../fixtures/ohlc-ds-1m.json';

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const DS_API_BASE = process.env.DS_API_BASE || '';
const GT_API_BASE = process.env.GT_API_BASE || '';
const CG_API_BASE = process.env.COINGECKO_API_BASE || '';
const CG_API_KEY = process.env.COINGECKO_API_KEY || '';

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
  const chain = event.queryStringParameters?.chain;
  const poolAddress = event.queryStringParameters?.poolAddress;
  const forceProvider = event.queryStringParameters?.provider as Provider | undefined;

  if (!isValidPair(pairId) || !isValidTf(tf) || !chain) {
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

  let candles: any[] = [];
  let provider: Provider | 'none' = 'none';

  if (forceProvider === 'cg' || (!forceProvider && CG_API_BASE && CG_API_KEY)) {
    try {
      const isAddr = /^0x[0-9a-fA-F]{40}$/.test(pairId);
      const cgUrl = `${CG_API_BASE}/${isAddr ? 'pool-ohlcv' : 'token-ohlcv'}/${pairId}?interval=${tf}`;
      const res = await fetch(cgUrl, {
        headers: { 'x-cg-pro-api-key': CG_API_KEY },
      });
      if (res.ok) {
        const cg = await res.json();
        const list = Array.isArray(cg?.data)
          ? cg.data
          : Array.isArray(cg?.candles)
          ? cg.candles
          : Array.isArray(cg)
          ? cg
          : [];
        candles = list.map((c: any) => ({
          t: Number(c[0] ?? c.timestamp),
          o: Number(c[1] ?? c.open),
          h: Number(c[2] ?? c.high),
          l: Number(c[3] ?? c.low),
          c: Number(c[4] ?? c.close),
          v: c[5] !== undefined ? Number(c[5]) : c.volume !== undefined ? Number(c.volume) : undefined,
        }));
        if (candles.length > 0) {
          const bodyRes: OHLCResponse = { pairId, tf, candles, provider: 'cg' };
          return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
        }
      }
    } catch {
      // ignore and fall through to DS
    }
  }

  if (forceProvider !== 'gt') {
    try {
      const ds = await fetchJson(`${DS_API_BASE}/dex/pairs/${pairId}/candles?timeframe=${tf}`);
      const dsList = Array.isArray(ds?.candles) ? ds.candles : [];
      candles = dsList.map((c: any) => ({
        t: Number(c.t ?? c.timestamp ?? c[0]),
        o: Number(c.o ?? c.open ?? c[1]),
        h: Number(c.h ?? c.high ?? c[2]),
        l: Number(c.l ?? c.low ?? c[3]),
        c: Number(c.c ?? c.close ?? c[4]),
        v: c.v !== undefined ? Number(c.v) : c[5] !== undefined ? Number(c[5]) : undefined,
      }));
      if (candles.length > 0) provider = 'ds';
    } catch {
      // ignore and fall through to GT
    }
  }

  if (candles.length === 0 && forceProvider !== 'ds' && chain && poolAddress) {
    try {
      const gtUrl = `${GT_API_BASE}/networks/${chain}/pools/${poolAddress}/ohlcv/${tf}`;
      const gtResp = await fetch(gtUrl, { headers: { 'Content-Type': 'application/json' } });
      if (gtResp.ok) {
        const gtData = await gtResp.json();
        const list = gtData.data?.attributes?.ohlcv || gtData.data?.attributes?.ohlcv_list || [];
        const mapped = Array.isArray(list)
          ? list
          : Array.isArray(gtData.data)
          ? gtData.data
          : Array.isArray(gtData.candles)
          ? gtData.candles
          : [];
        const candlesGt = mapped.map((c: any) => ({
          t: Number(c[0] ?? c.t ?? c.timestamp),
          o: Number(c[1] ?? c.o ?? c.open),
          h: Number(c[2] ?? c.h ?? c.high),
          l: Number(c[3] ?? c.l ?? c.low),
          c: Number(c[4] ?? c.c ?? c.close),
          v:
            c[5] !== undefined
              ? Number(c[5])
              : c.v !== undefined
              ? Number(c.v)
              : undefined,
        }));
        if (candlesGt.length > 0) {
          const bodyRes: OHLCResponse = { pairId, tf, candles: candlesGt, provider: 'gt' };
          return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
        }
      }
    } catch {
      // ignore
    }
  }

  const bodyRes: OHLCResponse = { pairId, tf, candles, provider };
  return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
};

