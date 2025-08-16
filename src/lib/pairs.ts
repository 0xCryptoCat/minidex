import type { PoolSummary } from './types';

export function resolvePairSymbols(
  tokenSymbol: string,
  pool: PoolSummary
): { baseSymbol: string; quoteSymbol: string } {
  return tokenSymbol === pool.base
    ? { baseSymbol: pool.base, quoteSymbol: pool.quote }
    : { baseSymbol: pool.quote, quoteSymbol: pool.base };
}
