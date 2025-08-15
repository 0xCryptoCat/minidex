import type { Timeframe } from './types';

export const MAP_TF_GT: Record<Timeframe, string> = {
  '1m': 'minute',
  '5m': '5m',
  '15m': '15m',
  '1h': 'hour',
  '4h': '4h',
  '1d': 'day',
};

export const MAP_TF_CG: Record<Timeframe, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

export const TF_SECONDS: Record<Timeframe, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
};

