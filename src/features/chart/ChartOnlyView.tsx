import { useState, useEffect, useRef } from 'react';
import type { Timeframe, Provider, TokenResponse } from '../../lib/types';
import PriceChart from './PriceChart';
import { getTradeMarkers, type TradeMarkerCluster } from '../trades/TradeMarkers';
import { ohlc } from '../../lib/api';
import { getCachedTf, setCachedTf } from '../../lib/tf-cache';
import { getTradesCache } from '../../lib/cache';
import { formatFetchMeta, type FetchMeta } from '../../lib/format';
import { 
  Flag as FlagIcon,
  OutlinedFlag as OutlinedFlagIcon,
  CandlestickChart as CandlestickChartIcon,
  AutoGraph as AutoGraphIcon,
  Equalizer as EqualizerIcon,
  GridOn as GridOnIcon,
  CropSquare as CropSquareIcon,
  Label as LabelIcon,
  LabelOff as LabelOffIcon,
  BorderInner as BorderInnerIcon,
  AutoFixHigh as AutoFixHighIcon,
} from '@mui/icons-material';

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
  const [showGrid, setShowGrid] = useState(true);
  const [showCrosshairLabels, setShowCrosshairLabels] = useState(true);
  const loggedRef = useRef(false);
  const DEBUG = (import.meta as any).env?.DEBUG === 'true';

  useEffect(() => {
    const cached = getCachedTf(pairId, provider);
    if (cached) {
      setTf(cached);
      setTfLoading(false);
      return;
    }
    
    // Complete list of all possible timeframes
    const allTimeframes: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'];
    const order: Timeframe[] =
      provider === 'cg' ? ['1m', '5m', '15m', '30m', '1h'] : 
      provider === 'gt' ? ['5m', '15m', '30m', '1h', '4h', '1d'] : 
      allTimeframes;
      
    (async () => {
      setTfLoading(true);
      setTfError(false);
      const availableTfSet = new Set<Timeframe>(); // Use Set to avoid duplicates
      
      // Test all timeframes to see which are available
      for (const t of allTimeframes) {
        try {
          const res = await ohlc({ pairId, chain, poolAddress, tf: t });
          if (res.data.candles.length > 0) {
            // Add both the requested timeframe and the effective timeframe
            availableTfSet.add(t);
            if (res.data.effectiveTf && res.data.effectiveTf !== t) {
              availableTfSet.add(res.data.effectiveTf);
            }
          }
        } catch {
          /* ignore and try next */
        }
      }
      
      // Convert set to sorted array
      const availableTfList = Array.from(availableTfSet).sort((a, b) => {
        const order = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'];
        return order.indexOf(a) - order.indexOf(b);
      });
      
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {/* Chart Settings Section */}
      <div className="section chart-settings-section" style={{ 
        margin: '0 16px 10px',
        padding: 'var(--space-2)',
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
      
      }}>
        {/* Chart Controls Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(32px, 1fr))',
          gap: 'var(--space-2)',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Trades Toggle */}
          <button
            onClick={handleToggle}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
            title="Toggle trade markers"
          >
            {showMarkers ? <FlagIcon sx={{ fontSize: 16 }} /> : <OutlinedFlagIcon sx={{ fontSize: 16 }} />}
          </button>

          {/* Chart Type Toggle */}
          <button
            onClick={() => setChartType(prev => prev === 'candlestick' ? 'line' : 'candlestick')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
            title={`Chart type: ${chartType}`}
          >
            {chartType === 'candlestick' ? <CandlestickChartIcon sx={{ fontSize: 16 }} /> : <AutoGraphIcon sx={{ fontSize: 16 }} />}
          </button>

          {/* Volume Toggle */}
          <button
            onClick={() => setShowVolume(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: showVolume ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
            title="Toggle volume"
          >
            <EqualizerIcon sx={{ fontSize: 16 }} />
          </button>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
            title="Toggle grid"
          >
            {showGrid ? <GridOnIcon sx={{ fontSize: 16 }} /> : <CropSquareIcon sx={{ fontSize: 16 }} />}
          </button>

          {/* Labels Toggle */}
          <button
            onClick={() => setShowCrosshairLabels(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
            title="Toggle labels"
          >
            {showCrosshairLabels ? <LabelIcon sx={{ fontSize: 16 }} /> : <LabelOffIcon sx={{ fontSize: 16 }} />}
          </button>

          {/* Crosshair Mode Toggle */}
          <button
            onClick={() => setCrosshairMode(prev => prev === 'normal' ? 'magnet' : 'normal')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
            title={`Crosshair: ${crosshairMode}`}
          >
            {crosshairMode === 'normal' ? <BorderInnerIcon sx={{ fontSize: 16 }} /> : <AutoFixHighIcon sx={{ fontSize: 16 }} />}
          </button>
        </div>
      </div>

      {/* OHLCV Data Section */}
      {/* <div className="section ohlcv-section" style={{ 
        margin: '0 16px 10px',
        padding: 'var(--space-2)',
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        }}>
        <div id="ohlcv-display" style={{ 
          fontSize: '12px',
          fontFamily: 'monospace',
          color: 'var(--text)',
          minHeight: '20px',
          display: 'flex',
          alignItems: 'center'
          }}>
          {/ This will be populated by the chart component /}
          <span style={{ color: 'var(--text-muted)' }}>Hover over chart for OHLCV data</span>
        </div>
      </div>

        {showMarkers && noTrades && (
          <div className="no-trades-notice">
            <div>No trades available</div>
            {meta && formatFetchMeta(meta) && (
              <div className="meta-info">{formatFetchMeta(meta)}</div>
            )}
          </div>
        )} */}
        
      <div>
        {/* Chart Container - full width, no margins, no background */}
        <div style={{ 
          flex: 1, 
          position: 'relative',
          width: '100%',
          margin: '0',
          padding: '0'
        }}>
          {/* Timeframe Selector Row */}
          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-1)', 
            marginBottom: 'var(--space-2)',
            flexWrap: 'wrap',
            alignItems: 'center'
            }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: 'var(--space-1)' }}>TF:</span>
            <select
              value={tf || ''}
              onChange={(e) => handleTfChange(e.target.value as Timeframe)}
              style={{
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-small)',
                fontSize: '12px',
                cursor: 'pointer',
                minWidth: '60px',
                outline: 'none',
              }}
            >
              {availableTfs.map((t) => (
                <option key={t} value={t} style={{ background: 'var(--bg-elev)', color: 'var(--text)' }}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          
          {/* Display Mode Toggle */}
          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-1)', 
            marginTop: 'var(--space-2)',
            alignItems: 'center'
            }}>
            <button
              onClick={() => setDisplayMode('price')}
              style={{
                background: 'none',
                border: 'none',
                color: displayMode === 'price' ? 'var(--brand-primary)' : 'var(--text-muted)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-small)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: displayMode === 'price' ? 600 : 400,
                transition: 'all var(--transition-fast)',
              }}
            >
              Price
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>/</span>
            <button
              onClick={() => setDisplayMode('marketcap')}
              style={{
                background: 'none',
                border: 'none',
                color: displayMode === 'marketcap' ? 'var(--brand-primary)' : 'var(--text-muted)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-small)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: displayMode === 'marketcap' ? 600 : 400,
                transition: 'all var(--transition-fast)',
              }}>
              MCap
            </button>
          </div>
        </div>

        {/* Chart Component */}
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
          pools={tokenDetail?.pools || []}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          chartType={chartType}
          showVolume={showVolume}
          crosshairMode={crosshairMode}
          showGrid={showGrid}
          showCrosshairLabels={showCrosshairLabels}
        />
      </div>
      
      {/* Simple powered by text */}
      <div style={{ 
        textAlign: 'center',
        padding: 'var(--space-1)',
        fontSize: '10px',
        color: 'var(--text-muted)',
        background: 'transparent',
      }}>
        Powered by TradingView
      </div>
    </div>
  );
}
