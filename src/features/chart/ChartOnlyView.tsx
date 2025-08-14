import { useState, useEffect } from 'react';
import type { Timeframe } from '../../lib/types';
import PriceChart from './PriceChart';
import { getTradeMarkers, type TradeMarkerCluster } from '../trades/TradeMarkers';

interface Props {
  pairId: string;
  chain: string;
  poolAddress?: string;
  address: string;
  tf: Timeframe;
  xDomain: [number, number] | null;
  onXDomainChange?: (d: [number, number]) => void;
}

export default function ChartOnlyView({ pairId, chain, poolAddress, address, tf, xDomain, onXDomainChange }: Props) {
  const [showMarkers, setShowMarkers] = useState(false);
  const [markers, setMarkers] = useState<TradeMarkerCluster[]>([]);
  const [noTrades, setNoTrades] = useState(false);

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

