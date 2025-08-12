import { useState, useEffect } from 'react';
import type { Timeframe } from '../../lib/types';
import PriceChart from './PriceChart';
import { getTradeMarkers, type TradeMarkerCluster } from '../trades/TradeMarkers';

interface Props {
  pairId: string;
  chain: string;
  tf: Timeframe;
  xDomain: [number, number] | null;
  onXDomainChange?: (d: [number, number]) => void;
}

export default function ChartOnlyView({ pairId, chain, tf, xDomain, onXDomainChange }: Props) {
  const [showMarkers, setShowMarkers] = useState(false);
  const [markers, setMarkers] = useState<TradeMarkerCluster[]>([]);

  useEffect(() => {
    if (showMarkers) {
      setMarkers(getTradeMarkers(pairId));
    }
  }, [pairId, showMarkers]);

  function handleToggle() {
    setShowMarkers((v) => {
      const next = !v;
      if (next) {
        setMarkers(getTradeMarkers(pairId));
      } else {
        setMarkers([]);
      }
      return next;
    });
  }

  return (
    <div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label>
          <input type="checkbox" checked={showMarkers} onChange={handleToggle} /> trades
        </label>
      </div>
      <PriceChart
        pairId={pairId}
        tf={tf}
        xDomain={xDomain}
        onXDomainChange={onXDomainChange}
        markers={showMarkers ? markers : []}
        chain={chain}
      />
    </div>
  );
}

