import type { Timeframe, Candle } from './types';

export function timeframeToSeconds(tf: Timeframe): number {
  switch (tf) {
    case '1m':
      return 60;
    case '5m':
      return 300;
    case '15m':
      return 900;
    case '1h':
      return 3600;
    case '4h':
      return 14400;
    case '1d':
      return 86400;
  }
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function rollupCandles(candles: Candle[], fromTf: Timeframe, toTf: Timeframe): Candle[] {
  const fromSec = timeframeToSeconds(fromTf);
  const toSec = timeframeToSeconds(toTf);
  if (toSec <= fromSec || toSec % fromSec !== 0) return candles;
  const result: Candle[] = [];
  let current: Candle | null = null;
  for (const c of candles) {
    const bucketStart = Math.floor(c.t / toSec) * toSec;
    if (!current || current.t !== bucketStart) {
      if (current) result.push(current);
      current = { t: bucketStart, o: c.o, h: c.h, l: c.l, c: c.c, v: c.v };
    } else {
      current.h = Math.max(current.h, c.h);
      current.l = Math.min(current.l, c.l);
      current.c = c.c;
      if (c.v !== undefined) current.v = (current.v || 0) + c.v;
    }
  }
  if (current) result.push(current);
  return result;
}

