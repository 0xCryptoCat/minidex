import type { Handler } from '@netlify/functions';
import type { TradesResponse, ApiError, Provider, Trade } from '../../src/lib/types';
import fs from 'fs/promises';
import { CHAIN_TO_GT_NETWORK } from '../shared/chains';
import { sanitizeTrades } from '../shared/agg';

const GT_FIXTURE = '../../fixtures/trades-gt.json';

const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const GT_API_BASE = process.env.GT_API_BASE || 'https://api.geckoterminal.com/api/v2';
const CG_API_BASE = process.env.COINGECKO_API_BASE || '';
const CG_API_KEY = process.env.COINGECKO_API_KEY || '';
const DEBUG = process.env.DEBUG_LOGS === 'true';

function log(...args: any[]) {
  if (DEBUG) console.log('[trades]', ...args);
}

function logError(...args: any[]) {
  console.error('[trades]', ...args);
}

function isValidPair(id?: string): id is string {
  return !!id;
}

async function readFixture(path: string): Promise<TradesResponse> {
  const url = new URL(path, import.meta.url);
  const data = await fs.readFile(url, 'utf8');
  return JSON.parse(data) as TradesResponse;
}

export const handler: Handler = async (event) => {
  const pairId = event.queryStringParameters?.pairId;
  const chain = event.queryStringParameters?.chain;
  const poolAddress = event.queryStringParameters?.poolAddress;
  const tokenParam = event.queryStringParameters?.token;
  const limit = Number(event.queryStringParameters?.limit) || 200;
  const windowH = Number(event.queryStringParameters?.window) || 24;
  const forceProvider = event.queryStringParameters?.provider as Provider | undefined;
  const gtSupported = event.queryStringParameters?.gtSupported !== 'false';
  const gtNetwork = chain ? CHAIN_TO_GT_NETWORK[chain] : undefined;
  const validPool = /^0x[0-9a-fA-F]{40}$/.test(poolAddress || '');
  const tokenOfInterest = tokenParam && /^0x[0-9a-fA-F]{40}$/.test(tokenParam)
    ? tokenParam.toLowerCase()
    : undefined;

  const SUPPORTED_CHAINS = Object.keys(CHAIN_TO_GT_NETWORK);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    'x-provider': 'none',
    'x-fallbacks-tried': '',
    'x-items': '0',
  };
  const attempted: string[] = [];
  if (!CG_API_KEY) attempted.push('cg:disabled');
  if (!isValidPair(pairId) || !chain) {
    const body: ApiError = { error: 'invalid_request', provider: 'none' };
    log('response', event.rawUrl, 400, 0, 'none');
    return { statusCode: 400, headers, body: JSON.stringify(body) };
  }
  if (!SUPPORTED_CHAINS.includes(chain)) {
    const body: ApiError = { error: 'unsupported_network', provider: 'none' };
    log('response', event.rawUrl, 200, 0, 'none');
    return { statusCode: 200, headers, body: JSON.stringify(body) };
  }

  log('params', { pairId, chain, poolAddress, tokenOfInterest, forceProvider, limit, windowH, gtSupported, gtNetwork });
  try {
    if (!gtNetwork) {
      log('skip gt: invalid network', chain);
    }
    if (!validPool) {
      headers['x-invalid-pool'] = '1';
      log('skip gt: invalid pool', poolAddress);
    }

    if (USE_FIXTURES) {
      try {
        attempted.push('gt');
        const gt = await readFixture(GT_FIXTURE);
        gt.pairId = pairId;
        headers['x-provider'] = 'gt';
        headers['x-fallbacks-tried'] = attempted.join(',');
        headers['x-items'] = String(gt.trades.length);
        log('response', event.rawUrl, 200, gt.trades.length, 'gt');
        return { statusCode: 200, headers, body: JSON.stringify(gt) };
      } catch (err) {
        logError('fixture read failed', err);
        headers['x-fallbacks-tried'] = attempted.join(',');
        const body: ApiError = { error: 'upstream_error', provider: 'none' };
        log('response', event.rawUrl, 500, 0, 'none');
        return { statusCode: 500, headers, body: JSON.stringify(body) };
      }
    }

    let trades: Trade[] = [];
    let provider: Provider | 'none' = 'none';
    let priceSourceHeader: 'from' | 'to' | '' = '';
    const cutoff = Date.now() - windowH * 3600 * 1000;

    if (
      (forceProvider === 'gt' || (!forceProvider && gtSupported)) &&
      gtNetwork &&
      validPool
    ) {
      attempted.push('gt');
      try {
        const gtUrl = `${GT_API_BASE}/networks/${gtNetwork}/pools/${poolAddress}/trades?limit=${limit}`;
        const gtResp = await fetch(gtUrl);
        if (gtResp.ok) {
          const gtData = await gtResp.json();
          const list = Array.isArray(gtData.data) ? gtData.data : [];
          const tradesGt = list.map((t: any) => {
            const attrs = t.attributes || {};
            const ts = Math.floor(Date.parse(attrs.block_timestamp) / 1000);
            const side = String(attrs.kind).toLowerCase() === 'buy' ? 'buy' : 'sell';
            const toAddr = String(attrs.to_token_address || '').toLowerCase();
            const fromAddr = String(attrs.from_token_address || '').toLowerCase();
            let price = 0;
            let amountBase = 0;
            let amountQuote = 0;
            let src: 'from' | 'to' = 'to';
            if (tokenOfInterest && tokenOfInterest === toAddr) {
              price = Number(attrs.price_to_in_usd ?? 0);
              amountBase = Number(attrs.to_token_amount ?? 0);
              amountQuote = Number(attrs.from_token_amount ?? 0);
              src = 'to';
            } else if (tokenOfInterest && tokenOfInterest === fromAddr) {
              price = Number(attrs.price_from_in_usd ?? 0);
              amountBase = Number(attrs.from_token_amount ?? 0);
              amountQuote = Number(attrs.to_token_amount ?? 0);
              src = 'from';
            } else if (attrs.price_to_in_usd !== undefined) {
              price = Number(attrs.price_to_in_usd ?? 0);
              amountBase = Number(attrs.to_token_amount ?? 0);
              amountQuote = Number(attrs.from_token_amount ?? 0);
              src = 'to';
            } else {
              price = Number(attrs.price_from_in_usd ?? 0);
              amountBase = Number(attrs.from_token_amount ?? 0);
              amountQuote = Number(attrs.to_token_amount ?? 0);
              src = 'from';
            }
            if (!priceSourceHeader) priceSourceHeader = src;
            return {
              ts,
              side,
              price,
              amountBase,
              amountQuote,
              txHash: attrs.tx_hash,
              wallet: attrs.tx_from_address,
            } as Trade;
          });
          trades = sanitizeTrades(
            tradesGt.filter((t) => t.ts * 1000 >= cutoff).slice(0, limit)
          );
          if (trades.length > 0) {
            provider = 'gt';
            log('gt trades', trades.length);
          }
        }
      } catch (err) {
        logError('gt trades fetch failed', err);
        // ignore
      }
    }

    if (trades.length === 0 && (forceProvider !== 'gt') && CG_API_BASE && CG_API_KEY && chain && poolAddress) {
      attempted.push('cg');
      try {
        const cgUrl = `${CG_API_BASE}/pool-trades-contract-address?chain=${chain}&address=${poolAddress}&limit=300`;
        const res = await fetch(cgUrl, {
          headers: { 'x-cg-pro-api-key': CG_API_KEY },
        });
        if (res.status === 401 || res.status === 403) {
          headers['x-cg-auth'] = 'fail';
          log('cg auth fail', res.status);
        }
        if (res.ok) {
          const cg = await res.json();
          const list = Array.isArray(cg?.data)
            ? cg.data
            : Array.isArray(cg?.trades)
            ? cg.trades
            : Array.isArray(cg)
            ? cg
            : [];
          const tradesCg = list.map((t: any) => {
            const attrs = t.attributes || t;
            const tsRaw = attrs.timestamp ?? attrs.ts ?? attrs.time ?? attrs[0];
            let ts = Number(tsRaw);
            if (!Number.isFinite(ts)) {
              ts = Math.floor(Date.parse(String(tsRaw)) / 1000);
            }
            const sideRaw = attrs.kind ?? attrs.trade_type ?? attrs.side ?? attrs.type ?? '';
            const toAddr = String(attrs.to_token_address || '').toLowerCase();
            const fromAddr = String(attrs.from_token_address || '').toLowerCase();
            let price = 0;
            let amountBase = 0;
            let amountQuote = 0;
            let src: 'from' | 'to' = 'to';
            if (tokenOfInterest && tokenOfInterest === toAddr) {
              price = Number(
                attrs.price_to_in_usd ??
                  attrs.price_usd ??
                  attrs.priceUsd ??
                  attrs.price ??
                  attrs[1] ??
                  0
              );
              amountBase = Number(
                attrs.to_token_amount ?? attrs.amount_base ?? attrs.amount_base_token ?? 0
              );
              amountQuote = Number(
                attrs.from_token_amount ?? attrs.amount_quote ?? attrs.amount_quote_token ?? 0
              );
              src = 'to';
            } else if (tokenOfInterest && tokenOfInterest === fromAddr) {
              price = Number(
                attrs.price_from_in_usd ??
                  attrs.price_usd ??
                  attrs.priceUsd ??
                  attrs.price ??
                  attrs[1] ??
                  0
              );
              amountBase = Number(
                attrs.from_token_amount ?? attrs.amount_base ?? attrs.amount_base_token ?? 0
              );
              amountQuote = Number(
                attrs.to_token_amount ?? attrs.amount_quote ?? attrs.amount_quote_token ?? 0
              );
              src = 'from';
            } else if (attrs.price_to_in_usd !== undefined) {
              price = Number(
                attrs.price_to_in_usd ??
                  attrs.price_usd ??
                  attrs.priceUsd ??
                  attrs.price ??
                  attrs[1] ??
                  0
              );
              amountBase = Number(
                attrs.to_token_amount ?? attrs.amount_base ?? attrs.amount_base_token ?? 0
              );
              amountQuote = Number(
                attrs.from_token_amount ?? attrs.amount_quote ?? attrs.amount_quote_token ?? 0
              );
              src = 'to';
            } else {
              price = Number(
                attrs.price_from_in_usd ??
                  attrs.price_usd ??
                  attrs.priceUsd ??
                  attrs.price ??
                  attrs[1] ??
                  0
              );
              amountBase = Number(
                attrs.from_token_amount ?? attrs.amount_base ?? attrs.amount_base_token ?? 0
              );
              amountQuote = Number(
                attrs.to_token_amount ?? attrs.amount_quote ?? attrs.amount_quote_token ?? 0
              );
              src = 'from';
            }
            if (!priceSourceHeader) priceSourceHeader = src;
            return {
              ts,
              side: String(sideRaw).toLowerCase() === 'sell' ? 'sell' : 'buy',
              price,
              amountBase,
              amountQuote,
              txHash: attrs.tx_hash || attrs.txHash,
              wallet: attrs.tx_from_address || attrs.wallet || attrs.address,
            } as Trade;
          });
          trades = sanitizeTrades(
            tradesCg.filter((t: Trade) => t.ts * 1000 >= cutoff).slice(0, limit)
          );
          if (trades.length > 0) {
            provider = 'cg';
            log('cg trades', trades.length);
          }
        }
      } catch (err) {
        logError('cg trades fetch failed', err);
        // ignore and fall through
      }
    }

    const bodyRes: TradesResponse = { pairId, trades, provider: provider as Provider };
    headers['x-provider'] = provider;
    headers['x-fallbacks-tried'] = attempted.join(',');
    headers['x-items'] = String(trades.length);
    if (tokenOfInterest) headers['x-token'] = tokenOfInterest;
    if (priceSourceHeader) headers['x-price-source'] = priceSourceHeader;
    log('response', event.rawUrl, 200, trades.length, provider);
    return { statusCode: 200, headers, body: JSON.stringify(bodyRes) };
  } catch (err) {
    logError('handler error', err);
    headers['x-fallbacks-tried'] = attempted.join(',');
    const body: ApiError = { error: 'internal_error', provider: 'none' };
    return { statusCode: 500, headers, body: JSON.stringify(body) };
  }
};

