import type { Candle, Trade } from '../../src/lib/types';

/**
 * Normalize a list of trades ensuring numeric fields are finite and that sides
 * are well-formed. Invalid trades are dropped and the remainder is sorted by
 * timestamp.
 */
export function sanitizeTrades(trades: Trade[]): Trade[] {
  const clean: Trade[] = [];
  for (const t of trades) {
    const ts = Math.floor(Number(t.ts));
    const price = Number(t.price);
    const amountBase =
      t.amountBase !== undefined ? Number(t.amountBase) : undefined;
    const amountQuote =
      t.amountQuote !== undefined ? Number(t.amountQuote) : undefined;
    if (!Number.isFinite(ts) || !Number.isFinite(price)) continue;
    if (amountBase !== undefined && !Number.isFinite(amountBase)) continue;
    if (amountQuote !== undefined && !Number.isFinite(amountQuote)) continue;
    const side = t.side === 'sell' ? 'sell' : 'buy';
    clean.push({
      ts,
      side,
      price,
      amountBase,
      amountQuote,
      txHash: t.txHash,
      wallet: t.wallet,
    });
  }
  clean.sort((a, b) => a.ts - b.ts);
  return clean;
}

/**
 * Aggregate trades into OHLC candles.
 *
 * Volume is summed using the trade's base amount when available. Trades
 * lacking a base amount contribute zero volume.
 */
export function buildCandlesFromTrades(
  trades: Trade[],
  tfSeconds: number = 60
): Candle[] {
  trades = sanitizeTrades(trades);
  const buckets: Record<number, Candle> = {};
  for (const t of trades) {
    const bucket = Math.floor(t.ts / tfSeconds) * tfSeconds;
    const candle = buckets[bucket];
    if (!candle) {
      buckets[bucket] = {
        t: bucket,
        o: t.price,
        h: t.price,
        l: t.price,
        c: t.price,
        v: t.amountBase ?? 0,
      };
    } else {
      candle.h = Math.max(candle.h, t.price);
      candle.l = Math.min(candle.l, t.price);
      candle.c = t.price;
      candle.v = (candle.v || 0) + (t.amountBase ?? 0);
    }
  }
  return Object.values(buckets).sort((a, b) => a.t - b.t);
}
