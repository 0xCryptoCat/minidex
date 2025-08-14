import type { Handler } from '@netlify/functions';
import type { OHLCResponse, ApiError, Provider, Timeframe, Trade } from '../../src/lib/types';
import fs from 'fs/promises';
import { toGTNetwork } from '../shared/chains';
import { buildCandlesFromTrades } from '../shared/agg';

const GT_FIXTURE = '../../fixtures/ohlc-gt-1m.json';
const DS_FIXTURE = '../../fixtures/ohlc-ds-1m.json';

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const GT_API_BASE = process.env.GT_API_BASE || 'https://api.geckoterminal.com/api/v2';
const CG_API_BASE = process.env.COINGECKO_API_BASE || '';
const CG_API_KEY = process.env.COINGECKO_API_KEY || '';
const DEBUG = process.env.DEBUG_LOGS === 'true';

function log(...args: any[]) {
  if (DEBUG) console.log('[ohlc]', ...args);
}

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

const TF_FALLBACK_GT: Record<Timeframe, Timeframe[]> = {
  '1m': ['1m', '5m', '15m', '1h'],
  '5m': ['5m', '15m', '1h'],
  '15m': ['15m', '1h'],
  '1h': ['1h', '4h', '1d'],
  '4h': ['4h', '1d'],
  '1d': ['1d'],
};

const TF_MAP_GT: Record<Timeframe, string> = {
  '1m': 'minute',
  '5m': '5m',
  '15m': '15m',
  '1h': 'hour',
  '4h': '4h',
  '1d': 'day',
};

const TF_FALLBACK_CG: Record<Timeframe, Timeframe[]> = {
  '1m': ['1m', '5m', '15m', '1h'],
  '5m': ['5m', '15m', '1h'],
  '15m': ['15m', '1h'],
  '1h': ['1h', '4h', '1d'],
  '4h': ['4h', '1d'],
  '1d': ['1d'],
};

const TF_TO_SEC: Record<Timeframe, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
};


function mapTfToCG(tf: Timeframe): string {
  const map: Record<Timeframe, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
  };
  return map[tf] || '1m';
}

export const handler: Handler = async (event) => {
  const pairId = event.queryStringParameters?.pairId;
  const tf = event.queryStringParameters?.tf as Timeframe | undefined;
  const chain = event.queryStringParameters?.chain;
  const poolAddress = event.queryStringParameters?.poolAddress;
  const forceProvider = event.queryStringParameters?.provider as Provider | undefined;
  const gtSupported = event.queryStringParameters?.gtSupported !== 'false';
  const gtNetwork = chain ? toGTNetwork(chain) : null;
  const SUPPORTED_CHAINS = new Set([
    'ethereum',
    'bsc',
    'polygon',
    'optimism',
    'arbitrum',
    'avalanche',
    'base',
  ]);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    'x-provider': 'none',
    'x-fallbacks-tried': '',
    'x-items': '0',
  };
  const attempted: string[] = [];
  if (!isValidPair(pairId) || !isValidTf(tf) || !chain) {
    const body: ApiError = { error: 'invalid_request', provider: 'none' };
    log('response', event.rawUrl, 400, 0, 'none');
    return { statusCode: 400, headers, body: JSON.stringify(body) };
  }
  if (!SUPPORTED_CHAINS.has(chain)) {
    const body: ApiError = { error: 'unsupported_network', provider: 'none' };
    log('response', event.rawUrl, 200, 0, 'none');
    return { statusCode: 200, headers, body: JSON.stringify(body) };
  }

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
  let effectiveTf: Timeframe | undefined;

  log('params', { pairId, tf, chain, poolAddress, forceProvider, gtSupported, gtNetwork });

  if ((forceProvider === 'gt' || (!forceProvider && gtSupported)) && gtNetwork && poolAddress) {
    attempted.push('gt');
    const tfs = TF_FALLBACK_GT[tf] || [tf];
    for (const t of tfs) {
      try {
        const gtTf = TF_MAP_GT[t] || 'minute';
        const gtUrl = `${GT_API_BASE}/networks/${gtNetwork}/pools/${poolAddress}/ohlcv/${gtTf}`;
        const gtResp = await fetch(gtUrl);
        if (!gtResp.ok) continue;
        const gtData = await gtResp.json();
        const list = gtData?.data?.attributes?.ohlcv_list || [];
        const candlesGt = Array.isArray(list)
          ? list.map((c: any) => ({
              t: Number(c[0]),
              o: Number(c[1]),
              h: Number(c[2]),
              l: Number(c[3]),
              c: Number(c[4]),
              v: c[5] !== undefined ? Number(c[5]) : undefined,
            }))
          : [];
        if (candlesGt.length > 0) {
          log('gt candles', candlesGt.length);
          candles = candlesGt;
          provider = 'gt';
          effectiveTf = t;
          break;
        }
      } catch {
        // ignore
      }
    }
  }

  if (
    candles.length === 0 &&
    forceProvider !== 'gt' &&
    CG_API_BASE &&
    CG_API_KEY &&
    chain &&
    poolAddress
  ) {
    attempted.push('cg');
    const tfs = TF_FALLBACK_CG[tf] || [tf];
    for (const t of tfs) {
      try {
        const cgUrl = `${CG_API_BASE}/pool-ohlcv-contract-address?chain=${chain}&address=${poolAddress}&interval=${mapTfToCG(t)}`;
        const res = await fetch(cgUrl, { headers: { 'x-cg-pro-api-key': CG_API_KEY } });
        if (res.ok) {
          const cg = await res.json();
          const list = Array.isArray(cg?.data)
            ? cg.data
            : Array.isArray(cg?.candles)
            ? cg.candles
            : Array.isArray(cg)
            ? cg
            : [];
          const candlesCg = list.map((c: any) => ({
            t: Number(c[0] ?? c.timestamp),
            o: Number(c[1] ?? c.open),
            h: Number(c[2] ?? c.high),
            l: Number(c[3] ?? c.low),
            c: Number(c[4] ?? c.close),
            v: c[5] !== undefined ? Number(c[5]) : c.volume !== undefined ? Number(c.volume) : undefined,
          }));
          if (candlesCg.length > 0) {
            candles = candlesCg;
            provider = 'cg';
            effectiveTf = t;
            log('cg candles', candles.length);
            break;
          }
        }
      } catch {
        // ignore
      }
    }
  }

  if (candles.length === 0) {
    let trades: Trade[] = [];
    if (CG_API_BASE && CG_API_KEY && chain && poolAddress) {
      attempted.push('cg-trades');
      try {
        const cgUrl = `${CG_API_BASE}/pool-trades-contract-address?chain=${chain}&address=${poolAddress}&limit=300`;
        const res = await fetch(cgUrl, { headers: { 'x-cg-pro-api-key': CG_API_KEY } });
        if (res.ok) {
          const cg = await res.json();
          const list = Array.isArray(cg?.data)
            ? cg.data
            : Array.isArray(cg?.trades)
            ? cg.trades
            : Array.isArray(cg)
            ? cg
            : [];
          trades = list.map((t: any) => {
            const attrs = t.attributes || t;
            const tsRaw =
              attrs.block_timestamp ?? attrs.timestamp ?? attrs.ts ?? attrs.time ?? attrs[0];
            const ts =
              typeof tsRaw === 'string' && !/^[0-9]+$/.test(tsRaw)
                ? Math.floor(new Date(tsRaw).getTime() / 1000)
                : Number(tsRaw);
            return {
              ts,
              price: parseFloat(
                attrs.price_to_in_usd ??
                  attrs.price_from_in_usd ??
                  attrs.price_usd ??
                  attrs.priceUsd ??
                  attrs.price ??
                  attrs[1] ??
                  '0'
              ),
              amountBase: parseFloat(
                attrs.to_token_amount ??
                  attrs.from_token_amount ??
                  attrs.amount_base ??
                  attrs.amount_base_token ??
                  '0'
              ),
            } as Trade;
          });
        }
      } catch {
        // ignore
      }
    }

    if (trades.length === 0 && gtSupported && gtNetwork && poolAddress) {
      attempted.push('gt-trades');
      try {
        const gtUrl = `${GT_API_BASE}/networks/${gtNetwork}/pools/${poolAddress}/trades?limit=300`;
        const resp = await fetch(gtUrl);
        if (resp.ok) {
          const gtData = await resp.json();
          const list = Array.isArray(gtData.data) ? gtData.data : [];
          trades = list.map((t: any) => {
            const attrs = t.attributes || {};
            return {
              ts: Math.floor(new Date(attrs.block_timestamp).getTime() / 1000),
              price: parseFloat(attrs.price_to_in_usd ?? attrs.price_from_in_usd ?? '0'),
              amountBase: parseFloat(
                attrs.to_token_amount ?? attrs.from_token_amount ?? '0'
              ),
            } as Trade;
          });
        }
      } catch {
        // ignore
      }
    }

    if (trades.length > 0) {
      const tfSec = TF_TO_SEC[tf] || 60;
      candles = buildCandlesFromTrades(trades, tfSec);
      provider = 'synthetic';
      effectiveTf = tf;
      headers['x-provider'] = 'synthetic';
      headers['x-synthesized-from'] = 'trades';
    }
  }

  const bodyRes: OHLCResponse = { pairId, tf, candles, provider, effectiveTf };
  headers['x-provider'] = provider;
  headers['x-fallbacks-tried'] = attempted.join(',');
  headers['x-items'] = String(candles.length);
  headers['x-effective-tf'] = effectiveTf || tf;
  log('response', event.rawUrl, 200, candles.length, provider);
  return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
};

