import { useState, useEffect } from 'react';
import type { Timeframe, Provider } from '../../lib/types';
import PriceChart from './PriceChart';
import { getTradeMarkers, type TradeMarkerCluster } from '../trades/TradeMarkers';
import { ohlc } from '../../lib/api';
import { getCachedTf, setCachedTf } from '../../lib/tf-cache';

interface Props {
  pairId: string;
  chain: string;
  poolAddress?: string;
  address: string;
  provider: Provider;
  xDomain: [number, number] | null;
  onXDomainChange?: (d: [number, number]) => void;
}

export default function ChartOnlyView({ pairId, chain, poolAddress, address, provider, xDomain, onXDomainChange }: Props) {
  const [showMarkers, setShowMarkers] = useState(false);
  const [markers, setMarkers] = useState<TradeMarkerCluster[]>([]);
  const [noTrades, setNoTrades] = useState(false);
  const [tf, setTf] = useState<Timeframe | null>(null);

  useEffect(() => {
    const cached = getCachedTf(pairId, provider);
    if (cached) {
      setTf(cached);
      return;
    }
    const order: Timeframe[] =
      provider === 'cg' ? ['1m', '5m'] : provider === 'gt' ? ['5m', '15m', '1h'] : ['1m'];
    (async () => {
      for (const t of order) {
        try {
          const res = await ohlc({ pairId, chain, poolAddress, tf: t, address });
          if (res.candles.length > 0 || res.effectiveTf) {
            const eff = res.effectiveTf || t;
            setTf(eff);
            setCachedTf(pairId, provider, eff);
            break;
          }
        } catch {
          /* ignore and try next */
        }
      }
    })();
  }, [pairId, provider, chain, poolAddress, address]);

  useEffect(() => {
    if (showMarkers) {
      const m = getTradeMarkers(pairId, chain, poolAddress);
      setMarkers(m);
      setNoTrades(m.length === 0);
    }
  }, [pairId, chain, poolAddress, showMarkers]);

  function handleToggle() {
    setShowMarkers((v) => {
      const next = !v;
      if (next) {
        setMarkers(getTradeMarkers(pairId, chain, poolAddress));
      } else {
        setMarkers([]);
      }
      return next;
    });
  }

  if (!tf) {
    return <div>Loading…</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label>
          <input type="checkbox" checked={showMarkers} onChange={handleToggle} /> trades
        </label>
      </div>
      {showMarkers && noTrades && <div style={{ marginBottom: '0.5rem' }}>No trades</div>}
      <PriceChart
        pairId={pairId}
        tf={tf}
        xDomain={xDomain}
        onXDomainChange={onXDomainChange}
        markers={showMarkers ? markers : []}
        chain={chain}
        poolAddress={poolAddress}
        address={address}
      />
    </div>
  );
}

