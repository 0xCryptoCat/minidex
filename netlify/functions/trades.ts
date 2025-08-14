import type { Handler } from '@netlify/functions';
import type { TradesResponse, ApiError, Provider, Trade } from '../../src/lib/types';
import fs from 'fs/promises';
import { isGtSupported } from './gt-allow';

const GT_FIXTURE = '../../fixtures/trades-gt.json';
const DS_FIXTURE = '../../fixtures/trades-ds.json';

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const DS_API_BASE = process.env.DS_API_BASE || '';
const GT_API_BASE = process.env.GT_API_BASE || '';
const CG_API_BASE = process.env.COINGECKO_API_BASE || '';
const CG_API_KEY = process.env.COINGECKO_API_KEY || '';
const DEBUG = process.env.DEBUG_LOGS === 'true';

function log(...args: any[]) {
  if (DEBUG) console.log('[trades]', ...args);
}

function isValidPair(id?: string): id is string {
  return !!id;
}

function isValidAddress(addr?: string): addr is string {
  return !!addr && /^0x[a-fA-F0-9]{40}$/.test(addr);
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

async function remapPool(chain: string, token: string): Promise<string | undefined> {
  const url = `${GT_API_BASE}/networks/${chain}/tokens/${token}/pools`;
  try {
    const resp = await fetchJson(url);
    const arr = Array.isArray(resp?.data) ? resp.data : [];
    const list = arr
      .map((d: any) => {
        const attr = d.attributes || {};
        return {
          addr: attr.pool_address,
          dex: attr.dex || attr.name || '',
          version: attr.version || attr.dex_version,
          liq: attr.reserve_in_usd ?? attr.reserve_usd ?? 0,
        };
      })
      .filter((p: any) => isValidAddress(p.addr));
    list.sort((a: any, b: any) => {
      const sup = Number(isGtSupported(b.dex, b.version)) - Number(isGtSupported(a.dex, a.version));
      if (sup !== 0) return sup;
      return b.liq - a.liq;
    });
    return list[0]?.addr;
  } catch {
    return undefined;
  }
}

export const handler: Handler = async (event) => {
  const pairId = event.queryStringParameters?.pairId;
  const chain = event.queryStringParameters?.chain;
  const poolAddress = event.queryStringParameters?.poolAddress;
  const address = event.queryStringParameters?.address;
  const limit = Number(event.queryStringParameters?.limit) || 200;
  const windowH = Number(event.queryStringParameters?.window) || 24;
  const forceProvider = event.queryStringParameters?.provider as Provider | undefined;

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
  if (!isValidPair(pairId) || !chain) {
    const body: ApiError = { error: 'invalid_request', provider: 'none' };
    log('response', event.rawUrl, 400, 0, 'none');
    return { statusCode: 400, headers, body: JSON.stringify(body) };
  }
  if (!SUPPORTED_CHAINS.has(chain)) {
    const body: ApiError = { error: 'unsupported_network', provider: 'none' };
    log('response', event.rawUrl, 200, 0, 'none');
    return { statusCode: 200, headers, body: JSON.stringify(body) };
  }

  log('params', { pairId, chain, poolAddress, forceProvider, limit, windowH });

  if (USE_FIXTURES) {
    try {
      if (forceProvider !== 'gt') {
        attempted.push('ds');
        const ds = await readFixture(DS_FIXTURE);
        ds.pairId = pairId;
        headers['x-provider'] = 'ds';
        headers['x-fallbacks-tried'] = attempted.join(',');
        headers['x-items'] = String(ds.trades.length);
        log('response', event.rawUrl, 200, ds.trades.length, 'ds');
        return { statusCode: 200, headers, body: JSON.stringify(ds) };
      }
      throw new Error('force gt');
    } catch {
      try {
        attempted.push('gt');
        const gt = await readFixture(GT_FIXTURE);
        gt.pairId = pairId;
        headers['x-provider'] = 'gt';
        headers['x-fallbacks-tried'] = attempted.join(',');
        headers['x-items'] = String(gt.trades.length);
        log('response', event.rawUrl, 200, gt.trades.length, 'gt');
        return { statusCode: 200, headers, body: JSON.stringify(gt) };
      } catch {
        headers['x-fallbacks-tried'] = attempted.join(',');
        const body: ApiError = { error: 'upstream_error', provider: 'none' };
        log('response', event.rawUrl, 500, 0, 'none');
        return { statusCode: 500, headers, body: JSON.stringify(body) };
      }
    }
  }

  let trades: Trade[] = [];
  let provider: Provider | 'none' = 'none';
  const cutoff = Date.now() - windowH * 3600 * 1000;

  if (forceProvider === 'cg' || (!forceProvider && CG_API_BASE && CG_API_KEY)) {
    attempted.push('cg');
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
        trades = trades.filter((t: Trade) => t.ts * 1000 >= cutoff).slice(0, limit);
        if (trades.length > 0) {
          log('cg trades', trades.length);
          headers['x-provider'] = 'cg';
          headers['x-fallbacks-tried'] = attempted.join(',');
          headers['x-items'] = String(trades.length);
          const bodyRes: TradesResponse = { pairId, trades, provider: 'cg' };
          log('response', event.rawUrl, 200, trades.length, 'cg');
          return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
        }
      }
    } catch {
      // ignore and fall through to DS
    }
  }

  if (forceProvider !== 'gt') {
    attempted.push('ds');
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
      trades = trades.filter((t: Trade) => t.ts * 1000 >= cutoff).slice(0, limit);
      if (trades.length > 0) {
        provider = 'ds';
        log('ds trades', trades.length);
      }
    } catch {
      // ignore and fall through to GT
    }
  }

  if (trades.length === 0 && forceProvider !== 'ds' && chain && poolAddress) {
    attempted.push('gt');
    let poolAddr = poolAddress;
    try {
      let gtUrl = `${GT_API_BASE}/networks/${chain}/pools/${poolAddr}/trades?limit=${limit}`;
      let gtResp = await fetch(gtUrl);
      if (gtResp.status === 404 && address) {
        const remapped = await remapPool(chain, address);
        if (remapped && remapped !== poolAddr) {
          log('remap', poolAddr, '->', remapped);
          poolAddr = remapped;
          headers['x-remapped-pool'] = '1';
          gtUrl = `${GT_API_BASE}/networks/${chain}/pools/${poolAddr}/trades?limit=${limit}`;
          gtResp = await fetch(gtUrl);
        }
      }
      if (gtResp.ok) {
        const gtData = await gtResp.json();
        const list = Array.isArray(gtData.data) ? gtData.data : [];
        const tradesGt = list.map((t: any) => ({
          ts: Math.floor(new Date(t.attributes.timestamp).getTime() / 1000),
          side: t.attributes.trade_type === 'buy' ? 'buy' : 'sell',
          price: Number(t.attributes.price_usd),
          amountBase: t.attributes.amount_base !== undefined ? Number(t.attributes.amount_base) : undefined,
          amountQuote: t.attributes.amount_quote !== undefined ? Number(t.attributes.amount_quote) : undefined,
          txHash: t.attributes.tx_hash,
          wallet: t.attributes.wallet,
        }));
        trades = tradesGt.filter((t) => t.ts * 1000 >= cutoff).slice(0, limit);
        if (trades.length > 0) {
          provider = 'gt';
          log('gt trades', trades.length);
        }
      }
    } catch {
      // ignore
    }
  }

  const bodyRes: TradesResponse = { pairId, trades, provider };
  headers['x-provider'] = provider;
  headers['x-fallbacks-tried'] = attempted.join(',');
  headers['x-items'] = String(trades.length);
  log('response', event.rawUrl, 200, trades.length, provider);
  return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
};

