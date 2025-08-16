import { useState, useEffect, useRef } from 'react';
import type { Timeframe, Provider } from '../../lib/types';
import PriceChart from './PriceChart';
import { getTradeMarkers, type TradeMarkerCluster } from '../trades/TradeMarkers';
import { ohlc } from '../../lib/api';
import { getCachedTf, setCachedTf } from '../../lib/tf-cache';
import { getTradesCache } from '../../lib/cache';
import { formatFetchMeta, type FetchMeta } from '../../lib/format';

interface Props {
  pairId: string;
  chain: string;
  poolAddress: string;
  provider: Provider;
  xDomain: [number, number] | null;
  onXDomainChange?: (d: [number, number]) => void;
  tokenAddress: string;
}

export default function ChartOnlyView({
  pairId,
  chain,
  poolAddress,
  provider,
  xDomain,
  onXDomainChange,
  tokenAddress,
}: Props) {
  const [showMarkers, setShowMarkers] = useState(false);
  const [markers, setMarkers] = useState<TradeMarkerCluster[]>([]);
  const [noTrades, setNoTrades] = useState(false);
  const [tf, setTf] = useState<Timeframe | null>(null);
  const [tfLoading, setTfLoading] = useState(true);
  const [tfError, setTfError] = useState(false);
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const loggedRef = useRef(false);
  const DEBUG = (import.meta as any).env?.DEBUG === 'true';

  useEffect(() => {
    const cached = getCachedTf(pairId, provider);
    if (cached) {
      setTf(cached);
      setTfLoading(false);
      return;
    }
    const order: Timeframe[] =
      provider === 'cg' ? ['1m', '5m'] : provider === 'gt' ? ['5m', '15m', '1h'] : ['1m'];
    (async () => {
      setTfLoading(true);
      setTfError(false);
      for (const t of order) {
        try {
          const res = await ohlc({ pairId, chain, poolAddress, tf: t });
          if (res.data.candles.length > 0 || res.data.effectiveTf) {
            const eff = res.data.effectiveTf || t;
            setTf(eff);
            setCachedTf(pairId, provider, eff);
            setTfLoading(false);
            return;
          }
        } catch {
          /* ignore and try next */
        }
      }
      // If we get here, no timeframes worked
      setTfError(true);
      setTfLoading(false);
    })();
  }, [pairId, provider, chain, poolAddress]);

  useEffect(() => {
    if (showMarkers) {
      const m = getTradeMarkers(pairId, chain, poolAddress, tokenAddress);
      setMarkers(m);
      setNoTrades(m.length === 0);
      const parts: string[] = [];
      if (chain) parts.push(chain);
      parts.push(pairId);
      if (poolAddress) parts.push(poolAddress);
      parts.push(tokenAddress);
      const key = parts.join(':');
      const cached = getTradesCache(key);
      setMeta(cached?.meta || null);
    }
  }, [pairId, chain, poolAddress, tokenAddress, showMarkers]);

  useEffect(() => {
    if (showMarkers && noTrades && meta && !loggedRef.current && DEBUG) {
      console.log('no-trades meta', meta);
      loggedRef.current = true;
    }
  }, [showMarkers, noTrades, meta]);

  function handleToggle() {
    setShowMarkers((v) => {
      const next = !v;
      if (next) {
        setMarkers(getTradeMarkers(pairId, chain, poolAddress, tokenAddress));
      } else {
        setMarkers([]);
      }
      return next;
    });
  }

  if (tfLoading) {
    return <div>Loading…</div>;
  }

  if (tfError || !tf) {
    return (
      <div className="limitation-notice">
        Chart data not available for this pair.
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '14px',
          cursor: 'pointer'
        }}>
          <input 
            type="checkbox" 
            checked={showMarkers} 
            onChange={handleToggle}
            style={{ accentColor: 'var(--accent-telegram)' }}
          /> 
          Trade markers
        </label>
      </div>
      {showMarkers && noTrades && (
        <div style={{ 
          padding: '8px 16px', 
          fontSize: '13px', 
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div>No trades available</div>
          {meta && formatFetchMeta(meta) && (
            <div style={{ fontSize: '11px', marginTop: '4px' }}>{formatFetchMeta(meta)}</div>
          )}
        </div>
      )}
      <div style={{ flex: 1, position: 'relative' }}>
        <PriceChart
          pairId={pairId}
          tf={tf}
          xDomain={xDomain}
          onXDomainChange={onXDomainChange}
          markers={showMarkers ? markers : []}
          chain={chain}
          poolAddress={poolAddress}
          tokenAddress={tokenAddress}
        />
      </div>
    </div>
  );
}

