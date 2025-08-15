import type { Trade, TradeSide, TradeMarker } from '../../lib/types';
import { getTradesCache } from '../../lib/cache';

export interface TradeMarkerCluster extends TradeMarker {
  trades: Trade[];
}

const MAX_MARKERS = 200;

function shortAddr(addr?: string): string | undefined {
  if (!addr) return undefined;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function computeTradeMarkers(trades: Trade[], limit = MAX_MARKERS): TradeMarkerCluster[] {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const minute = Math.floor(t.ts / 60) * 60;
    const key = `${minute}-${t.side}`;
    const arr = groups.get(key) || [];
    arr.push(t);
    groups.set(key, arr);
  }
  const markers: TradeMarkerCluster[] = [];
  for (const [key, arr] of groups.entries()) {
    const [tsStr, sideStr] = key.split('-');
    const ts = Number(tsStr);
    const side = sideStr as TradeSide;
    const size = arr.reduce((sum, t) => sum + (t.amountBase || 0), 0);
    const price = arr[arr.length - 1].price;
    const marker: TradeMarkerCluster = {
      ts,
      side,
      price,
      size,
      clusterSize: arr.length,
      trades: arr,
    };
    if (arr.length === 1) {
      marker.txHash = arr[0].txHash;
      marker.walletShort = shortAddr(arr[0].wallet);
    }
    markers.push(marker);
  }
  markers.sort((a, b) => a.ts - b.ts);
  return markers.slice(-limit);
}

export function getTradeMarkers(
  pairId: string,
  chain?: string,
  poolAddress?: string,
  tokenAddress?: string,
  limit = MAX_MARKERS
): TradeMarkerCluster[] {
  const parts = [] as string[];
  if (chain) parts.push(chain);
  parts.push(pairId);
  if (poolAddress) parts.push(poolAddress);
  if (tokenAddress) parts.push(tokenAddress);
  const key = parts.join(':');
  const cached = getTradesCache(key);
  if (!cached) return [];
  return computeTradeMarkers(cached.data.trades, limit);
}

