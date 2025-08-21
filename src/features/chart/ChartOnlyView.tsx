import { useState, useEffect, useRef } from 'react';
import type { Timeframe, Provider, TokenResponse } from '../../lib/types';
import type { ProcessedSecurityData } from '../../lib/goplus-types';
import PriceChart from './PriceChart';
import TimeframeSelector from './TimeframeSelector';
import { getTradeMarkers, type TradeMarkerCluster } from '../trades/TradeMarkers';
import { ohlc } from '../../lib/api';
import { getCachedTf, setCachedTf } from '../../lib/tf-cache';
import { getTradesCache } from '../../lib/cache';
import { formatFetchMeta, type FetchMeta } from '../../lib/format';

type DisplayMode = 'price' | 'marketcap';

interface Props {
  pairId: string;
  chain: string;
  poolAddress: string;
  provider: Provider;
  xDomain: [number, number] | null;
  onXDomainChange?: (d: [number, number]) => void;
  tokenAddress: string;
  tokenDetail?: TokenResponse | null;
  securityData?: ProcessedSecurityData | null;
}

export default function ChartOnlyView({
  pairId,
  chain,
  poolAddress,
  provider,
  xDomain,
  onXDomainChange,
  tokenAddress,
  tokenDetail = null,
  securityData = null,
}: Props) {
  const [showMarkers, setShowMarkers] = useState(false);
  const [markers, setMarkers] = useState<TradeMarkerCluster[]>([]);
  const [noTrades, setNoTrades] = useState(false);
  const [tf, setTf] = useState<Timeframe | null>(null);
  const [availableTfs, setAvailableTfs] = useState<Timeframe[]>([]);
  const [tfLoading, setTfLoading] = useState(true);
  const [tfError, setTfError] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('price');
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  // New chart configuration states
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [showVolume, setShowVolume] = useState(true);
  const [crosshairMode, setCrosshairMode] = useState<'normal' | 'magnet'>('normal');
  const loggedRef = useRef(false);
  const DEBUG = (import.meta as any).env?.DEBUG === 'true';

  useEffect(() => {
    const cached = getCachedTf(pairId, provider);
    if (cached) {
      setTf(cached);
      setTfLoading(false);
      return;
    }
    
    const allTimeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
    const order: Timeframe[] =
      provider === 'cg' ? ['1m', '5m'] : provider === 'gt' ? ['5m', '15m', '1h'] : allTimeframes;
      
    (async () => {
      setTfLoading(true);
      setTfError(false);
      const availableTfList: Timeframe[] = [];
      
      // Test all timeframes to see which are available
      for (const t of allTimeframes) {
        try {
          const res = await ohlc({ pairId, chain, poolAddress, tf: t });
          if (res.data.candles.length > 0 || res.data.effectiveTf) {
            availableTfList.push(res.data.effectiveTf || t);
          }
        } catch {
          /* ignore and try next */
        }
      }
      
      setAvailableTfs(availableTfList);
      
      // Set initial timeframe from available ones
      const initialTf = order.find(t => availableTfList.includes(t)) || availableTfList[0];
      if (initialTf) {
        setTf(initialTf);
        setCachedTf(pairId, provider, initialTf);
        setTfLoading(false);
      } else {
        setTfError(true);
        setTfLoading(false);
      }
    })();
  }, [pairId, provider, chain, poolAddress]);

  const handleTfChange = (newTf: Timeframe) => {
    setTf(newTf);
    setCachedTf(pairId, provider, newTf);
  };

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
      <div className="chart-controls">
        <div className="chart-controls-left">
          <TimeframeSelector 
            selectedTf={tf}
            availableTfs={availableTfs}
            onTfChange={handleTfChange}
            disabled={tfLoading}
          />
          {/* TODO: Uncomment when totalSupply data is available
          <div className="chart-display-mode">
            <button
              className={`chart-mode-button ${displayMode === 'price' ? 'selected' : ''}`}
              onClick={() => setDisplayMode('price')}
              type="button"
            >
              Price
            </button>
            <button
              className={`chart-mode-button ${displayMode === 'marketcap' ? 'selected' : ''}`}
              onClick={() => setDisplayMode('marketcap')}
              disabled={!tokenDetail?.info}
              type="button"
            >
              Market Cap
            </button>
          </div>
          */}
          <label className="trade-markers-toggle">
            <input 
              type="checkbox" 
              checked={showMarkers} 
              onChange={handleToggle}
            /> 
            <span>Trades</span>
          </label>
          
          {/* Chart Type Toggle */}
          <div className="chart-type-toggle" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              className={`chart-type-button ${chartType === 'candlestick' ? 'selected' : ''}`}
              onClick={() => setChartType('candlestick')}
              type="button"
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: chartType === 'candlestick' ? 'var(--accent-lime)' : 'transparent',
                color: chartType === 'candlestick' ? 'var(--bg)' : 'var(--text)',
                cursor: 'pointer'
              }}
            >
              Candles
            </button>
            <button
              className={`chart-type-button ${chartType === 'line' ? 'selected' : ''}`}
              onClick={() => setChartType('line')}
              type="button"
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: chartType === 'line' ? 'var(--accent-lime)' : 'transparent',
                color: chartType === 'line' ? 'var(--bg)' : 'var(--text)',
                cursor: 'pointer'
              }}
            >
              Line
            </button>
          </div>
          
          {/* Volume Toggle */}
          <label className="volume-toggle" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <input 
              type="checkbox" 
              checked={showVolume} 
              onChange={(e) => setShowVolume(e.target.checked)}
            /> 
            <span>Volume</span>
          </label>
        </div>
        <div className="chart-controls-right">
          {/* Crosshair Mode Toggle */}
          <button
            onClick={() => setCrosshairMode(prev => prev === 'normal' ? 'magnet' : 'normal')}
            type="button"
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: crosshairMode === 'magnet' ? 'var(--accent-telegram)' : 'transparent',
              color: crosshairMode === 'magnet' ? 'var(--bg)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
            title={`Crosshair: ${crosshairMode}`}
          />
            {crosshairMode === 'magnet' ? '🧲' : '+'}
        </div>
      </div>
      {showMarkers && noTrades && (
        <div className="no-trades-notice">
          <div>No trades available</div>
          {meta && formatFetchMeta(meta) && (
            <div className="meta-info">{formatFetchMeta(meta)}</div>
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
          tokenDetail={tokenDetail}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          chartType={chartType}
          showVolume={showVolume}
          crosshairMode={crosshairMode}
        />
      </div>
      
      {/* Chart info badges moved below */}
      <div className="chart-badges" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: 'var(--space-2) var(--space-4)',
        background: 'var(--bg-elev)',
        borderTop: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {tf && (
            <span>UTC • {tf}</span>
          )}
          {/* Add provider info if available */}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {meta && formatFetchMeta(meta) && (
            <span>{formatFetchMeta(meta)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

