import type { Candle, Trade, Timeframe, MetricSeries } from './types';
import { timeframeToSeconds } from './time';

const ric =
  typeof requestIdleCallback !== 'undefined'
    ? requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 0);

/* --- Rolling volume (base token) --- */
export function rollingVolumeBase(
  candles: Candle[],
  window = 14
): MetricSeries {
  const points: MetricSeries['points'] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    const v = candles[i].v || 0;
    sum += v;
    if (i >= window) sum -= candles[i - window].v || 0;
    if (i >= window - 1) {
      points.push({ t: candles[i].t, v: sum });
    }
  }
  return { key: 'rollingVolumeBase', points };
}

/* --- Liquidity (USD, approximated by trade sizes) --- */
export function liquidityUsd(
  trades: Trade[],
  tf: Timeframe,
  window = 14
): MetricSeries {
  const bucketSec = timeframeToSeconds(tf);
  const buckets = new Map<number, number>();
  trades.forEach((tr) => {
    const bucket = Math.floor(tr.ts / bucketSec) * bucketSec;
    // Use only volumeUSD (volume_in_usd from API) - no fallbacks
    const val = tr.volumeUSD || 0;
    buckets.set(bucket, (buckets.get(bucket) || 0) + val);
  });
  const entries = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);
  const roll: { t: number; v: number }[] = entries.map(([t, v]) => ({ t, v }));
  const points: MetricSeries['points'] = [];
  let sum = 0;
  for (let i = 0; i < roll.length; i++) {
    sum += roll[i].v;
    if (i >= window) sum -= roll[i - window].v;
    if (i >= window - 1) points.push({ t: roll[i].t, v: sum / window });
  }
  return { key: 'liquidityUsd', points, unit: 'USD' };
}

/* --- ATR-lite --- */
export function atrLite(candles: Candle[], window = 14): MetricSeries {
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const prevClose = i > 0 ? candles[i - 1].c : c.o;
    const range = Math.max(
      c.h - c.l,
      Math.abs(c.h - prevClose),
      Math.abs(c.l - prevClose)
    );
    tr.push(range);
  }
  const points: MetricSeries['points'] = [];
  let sum = 0;
  for (let i = 0; i < tr.length; i++) {
    sum += tr[i];
    if (i >= window) sum -= tr[i - window];
    if (i >= window - 1) points.push({ t: candles[i].t, v: sum / window });
  }
  return { key: 'atrLite', points };
}

/* --- Returns z-score --- */
export function returnsZScore(
  candles: Candle[],
  window = 20
): MetricSeries {
  const returns: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1].c;
    const ret = prev ? Math.log(candles[i].c / prev) : 0;
    returns.push(ret);
  }
  const points: MetricSeries['points'] = [];
  for (let i = window - 1; i < returns.length; i++) {
    const slice = returns.slice(i - window + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / window;
    const std = Math.sqrt(
      slice.reduce((a, b) => a + (b - mean) ** 2, 0) / window
    );
    const z = std ? (returns[i] - mean) / std : 0;
    points.push({ t: candles[i + 1].t, v: z });
  }
  return { key: 'returnsZScore', points };
}

/* --- Trades per interval --- */
export function tradesPerInterval(
  trades: Trade[],
  tf: Timeframe
): MetricSeries {
  const bucketSec = timeframeToSeconds(tf);
  const buckets = new Map<number, number>();
  trades.forEach((tr) => {
    const bucket = Math.floor(tr.ts / bucketSec) * bucketSec;
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
  });
  const points = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([t, v]) => ({ t, v }));
  return { key: 'tradesPerInterval', points };
}

export { ric };
