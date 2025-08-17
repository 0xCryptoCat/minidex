import type { PoolSummary } from './types';
import { getPoolDetailsCache, setPoolDetailsCache } from './cache';

/**
 * Pool data manager to handle individual pool caching and data retrieval
 */
export class PoolDataManager {
  private static instance: PoolDataManager;
  private poolsMap: Map<string, PoolSummary> = new Map();

  static getInstance(): PoolDataManager {
    if (!PoolDataManager.instance) {
      PoolDataManager.instance = new PoolDataManager();
    }
    return PoolDataManager.instance;
  }

  /**
   * Cache pool data for individual pools
   */
  cachePools(pools: PoolSummary[]) {
    pools.forEach(pool => {
      this.poolsMap.set(pool.pairId, pool);
      setPoolDetailsCache(pool.pairId, pool);
    });
  }

  /**
   * Get a specific pool by pairId from cache
   */
  getPool(pairId: string): PoolSummary | undefined {
    // Try memory cache first
    let pool = this.poolsMap.get(pairId);
    if (pool) return pool;

    // Try persistent cache
    pool = getPoolDetailsCache(pairId);
    if (pool) {
      this.poolsMap.set(pairId, pool);
      return pool;
    }

    return undefined;
  }

  /**
   * Update a specific pool's data
   */
  updatePool(pool: PoolSummary) {
    this.poolsMap.set(pool.pairId, pool);
    setPoolDetailsCache(pool.pairId, pool);
  }

  /**
   * Get all cached pools for a token (by base/quote symbol combination)
   */
  getPoolsForToken(baseSymbol: string, quoteSymbol?: string): PoolSummary[] {
    const pools = Array.from(this.poolsMap.values());
    return pools.filter(pool => {
      const baseMatch = pool.base === baseSymbol || pool.baseToken?.symbol === baseSymbol;
      if (!quoteSymbol) return baseMatch;
      const quoteMatch = pool.quote === quoteSymbol || pool.quoteToken?.symbol === quoteSymbol;
      return baseMatch && quoteMatch;
    });
  }

  /**
   * Clear cache
   */
  clear() {
    this.poolsMap.clear();
  }

  /**
   * Get all cached pools
   */
  getAllPools(): PoolSummary[] {
    return Array.from(this.poolsMap.values());
  }
}

export const poolDataManager = PoolDataManager.getInstance();
