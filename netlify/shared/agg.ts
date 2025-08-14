import type { Candle, Trade } from '../../src/lib/types';

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
