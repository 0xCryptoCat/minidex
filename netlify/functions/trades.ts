import type { Handler } from '@netlify/functions';
import type { TradesResponse, ApiError, Provider, Trade } from '../../src/lib/types';
import fs from 'fs/promises';

const GT_FIXTURE = '../../fixtures/trades-gt.json';
const DS_FIXTURE = '../../fixtures/trades-ds.json';

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const DS_API_BASE = process.env.DS_API_BASE || '';
const GT_API_BASE = process.env.GT_API_BASE || '';
const CG_API_BASE = process.env.COINGECKO_API_BASE || '';
const CG_API_KEY = process.env.COINGECKO_API_KEY || '';

function isValidPair(id?: string): id is string {
  return !!id;
}

async function readFixture(path: string): Promise<TradesResponse> {
  const url = new URL(path, import.meta.url);
  const data = await fs.readFile(url, 'utf8');
  return JSON.parse(data) as TradesResponse;
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
  const chain = event.queryStringParameters?.chain;
  const forceProvider = event.queryStringParameters?.provider as Provider | undefined;

  if (!isValidPair(pairId) || !chain) {
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
        return { statusCode: 200, headers, body: JSON.stringify(ds) };
      }
      throw new Error('force gt');
    } catch {
      try {
        const gt = await readFixture(GT_FIXTURE);
        gt.pairId = pairId;
        return { statusCode: 200, headers, body: JSON.stringify(gt) };
      } catch {
        const body: ApiError = { error: 'upstream_error', provider: 'none' };
        return { statusCode: 500, headers, body: JSON.stringify(body) };
      }
    }
  }

  let trades: Trade[] = [];
  let provider: Provider | 'none' = 'none';

  if (forceProvider === 'cg' || (!forceProvider && CG_API_BASE && CG_API_KEY)) {
    try {
      const cgUrl = `${CG_API_BASE}/pool-trades/${pairId}`;
      const res = await fetch(cgUrl, {
        headers: { 'x-cg-pro-api-key': CG_API_KEY },
      });
      if (res.ok) {
        const cg = await res.json();
        const list = Array.isArray(cg?.data)
          ? cg.data
          : Array.isArray(cg?.trades)
          ? cg.trades
          : Array.isArray(cg)
          ? cg
          : [];
        trades = list.map((t: any) => ({
          ts: Number(t.timestamp ?? t.ts ?? t.time ?? t[0]),
          side: (t.trade_type || t.side || t.type || '').toLowerCase() === 'sell' ? 'sell' : 'buy',
          price: Number(t.price_usd ?? t.priceUsd ?? t.price ?? t[1] ?? 0),
          amountBase:
            t.amount_base !== undefined
              ? Number(t.amount_base)
              : t.amount_base_token !== undefined
              ? Number(t.amount_base_token)
              : undefined,
          amountQuote:
            t.amount_quote !== undefined
              ? Number(t.amount_quote)
              : t.amount_quote_token !== undefined
              ? Number(t.amount_quote_token)
              : undefined,
          txHash: t.tx_hash || t.txHash,
          wallet: t.wallet || t.address,
        }));
        if (trades.length > 0) {
          const bodyRes: TradesResponse = { pairId, trades, provider: 'cg' };
          return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
        }
      }
    } catch {
      // ignore and fall through to DS
    }
  }

  if (forceProvider !== 'gt') {
    try {
      const ds = await fetchJson(`${DS_API_BASE}/dex/pairs/${pairId}/trades`);
      const dsList = Array.isArray(ds?.trades) ? ds.trades : [];
      trades = dsList.map((t: any) => ({
        ts: Number(t.ts ?? t.time ?? t.blockTimestamp ?? t[0]),
        side: (t.side || t.type || t.tradeType || '').toLowerCase() === 'sell' ? 'sell' : 'buy',
        price: Number(t.priceUsd ?? t.price_usd ?? t.price ?? t[1] ?? 0),
        amountBase:
          t.amountBase !== undefined
            ? Number(t.amountBase)
            : t.baseAmount !== undefined
            ? Number(t.baseAmount)
            : t.amount0 !== undefined
            ? Number(t.amount0)
            : undefined,
        amountQuote:
          t.amountQuote !== undefined
            ? Number(t.amountQuote)
            : t.quoteAmount !== undefined
            ? Number(t.quoteAmount)
            : t.amount1 !== undefined
            ? Number(t.amount1)
            : undefined,
        txHash: t.txHash || t.tx_hash || t.transactionHash,
        wallet: t.wallet || t.maker || t.trader,
      }));
      if (trades.length > 0) provider = 'ds';
    } catch {
      // ignore and fall through to GT
    }
  }

  if (trades.length === 0 && forceProvider !== 'ds') {
    try {
      const gt = await fetchJson(`${GT_API_BASE}/networks/${chain}/pools/${pairId}/trades`);
      const list = Array.isArray(gt?.data)
        ? gt.data
        : Array.isArray(gt?.trades)
        ? gt.trades
        : [];
      trades = list.map((d: any) => {
        const t = d.attributes || d;
        return {
          ts: Number(t.timestamp ?? t.ts ?? t.time ?? t[0]),
          side: (t.trade_type || t.side || t.type || '').toLowerCase() === 'sell' ? 'sell' : 'buy',
          price: Number(t.price_usd ?? t.priceUsd ?? t.price ?? t[1] ?? 0),
          amountBase:
            t.amount_base !== undefined
              ? Number(t.amount_base)
              : t.token_amount_in !== undefined
              ? Number(t.token_amount_in)
              : t.baseAmount !== undefined
              ? Number(t.baseAmount)
              : undefined,
          amountQuote:
            t.amount_quote !== undefined
              ? Number(t.amount_quote)
              : t.token_amount_out !== undefined
              ? Number(t.token_amount_out)
              : t.quoteAmount !== undefined
              ? Number(t.quoteAmount)
              : undefined,
          txHash: t.tx_hash || t.txHash,
          wallet: t.address || t.wallet || t.trader,
        };
      });
      if (trades.length > 0) provider = 'gt';
    } catch {
      // still empty
    }
  }

  const bodyRes: TradesResponse = { pairId, trades, provider };
  return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
};

