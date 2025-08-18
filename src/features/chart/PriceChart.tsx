import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, type IChartApi, type UTCTimestamp } from 'lightweight-charts';
import type { Timeframe, Candle, TokenResponse } from '../../lib/types';
import { ohlc, trades } from '../../lib/api';
import { formatFetchMeta, type FetchMeta, formatUsd } from '../../lib/format';
import { createPoller } from '../../lib/polling';
import { rollupCandles } from '../../lib/time';
import type { TradeMarkerCluster } from '../trades/TradeMarkers';
import ChartLoader from '../../components/ChartLoader';
import chains from '../../lib/chains.json';

function toLWCandles(cs: { t: number; o: number; h: number; l: number; c: number }[]) {
  const out: { time: number; open: number; high: number; low: number; close: number }[] = [];
  let prevT = -Infinity;
  for (const k of cs) {
    const time = Math.floor(Number(k.t));
    const open = Number(k.o);
    const high = Number(k.h);
    const low = Number(k.l);
    const close = Number(k.c);
    if (![time, open, high, low, close].every(Number.isFinite)) continue;
    if (time <= prevT) continue;
    out.push({ time, open, high, low, close });
    prevT = time;
  }
  return out;
}

type DisplayMode = 'price' | 'marketcap';

interface Props {
  pairId: string;
  tf: Timeframe;
  xDomain: [number, number] | null;
  onXDomainChange?: (d: [number, number]) => void;
  markers?: TradeMarkerCluster[];
  chain: string;
  poolAddress: string;
  tokenAddress: string;
  tokenDetail?: TokenResponse | null;
  displayMode?: DisplayMode;
  onDisplayModeChange?: (mode: DisplayMode) => void;
}

export default function PriceChart({
  pairId,
  tf,
  xDomain,
  onXDomainChange,
  markers = [],
  chain,
  poolAddress,
  tokenAddress,
  tokenDetail = null,
  displayMode = 'price',
  onDisplayModeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const markersMapRef = useRef<Map<number, TradeMarkerCluster[]>>(new Map());
  const [hoveredMarkers, setHoveredMarkers] = useState<TradeMarkerCluster[] | null>(null);
  const [provider, setProvider] = useState<string>('');
  const [degraded, setDegraded] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [effectiveTf, setEffectiveTf] = useState<Timeframe | undefined>();
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const loggedRef = useRef(false);
  const sampleCandlesLoggedRef = useRef(false);
  const rangeRafRef = useRef<number | null>(null);
  const DEBUG = (import.meta as any).env?.DEBUG === 'true';

  const explorerTemplate = useMemo(() => {
    if (!chain) return undefined;
    const entry: any = (chains as any[]).find((c) => c.slug === chain);
    return entry?.explorerTx as string | undefined;
  }, [chain]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create chart with modern theme
    const chart = createChart(containerRef.current, { 
      height: containerRef.current.clientHeight || 400,
      width: containerRef.current.clientWidth || 800,
      layout: {
        background: { color: 'transparent' },
        textColor: '#ffffff',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      crosshair: {
        mode: 1, // Normal crosshair mode
        vertLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          style: 2, // Dashed line
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          style: 2, // Dashed line
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        rightOffset: 12,
        barSpacing: 6,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      leftPriceScale: {
        visible: false,
      },
      handleScroll: true,
      handleScale: true,
    });
    
    // Add candlestick series with theme colors
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#34c759', // --buy-primary
      downColor: '#e13232', // --sell-primary
      borderUpColor: '#34c759',
      borderDownColor: '#e13232',
      wickUpColor: '#34c759',
      wickDownColor: '#e13232',
    });
    
    // Add volume series with theme colors
    const volumeSeries = chart.addHistogramSeries({
      priceScaleId: '',
      priceFormat: { type: 'volume' },
      color: 'rgba(255, 255, 255, 0.2)',
    });
    
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
      borderColor: 'rgba(255, 255, 255, 0.2)',
    });
    
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    function handleResize() {
      const container = containerRef.current;
      if (container) {
        chart.applyOptions({ 
          width: container.clientWidth,
          height: container.clientHeight || 400
        });
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);

    if (onXDomainChange) {
      chart.timeScale().subscribeVisibleTimeRangeChange((range) => {
        if (range && range.from !== undefined && range.to !== undefined) {
          onXDomainChange([range.from as number, range.to as number]);
        }
      });
    }

    const crosshairHandler = (param: any) => {
      if (param.time === undefined) {
        setHoveredMarkers(null);
        return;
      }
      const arr = markersMapRef.current.get(param.time as number);
      setHoveredMarkers(arr || null);
    };
    chart.subscribeCrosshairMove(crosshairHandler);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.unsubscribeCrosshairMove(crosshairHandler);
      chart.remove();
    };
  }, [onXDomainChange]);

  useEffect(() => {
    if (!chartRef.current || !xDomain || !hasData) return;
    const [from, to] = xDomain;
    if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to) return;
    const chart = chartRef.current;
    rangeRafRef.current = requestAnimationFrame(() => {
      try {
        chart.timeScale().setVisibleRange({ from: from as any, to: to as any });
      } catch {
        // ignore if chart was destroyed
      }
    });
    return () => {
      if (rangeRafRef.current) {
        cancelAnimationFrame(rangeRafRef.current);
        rangeRafRef.current = null;
      }
    };
  }, [xDomain, hasData]);

  useEffect(() => {
    markersMapRef.current.clear();
    if (!markers || markers.length === 0) {
      candleSeriesRef.current?.setMarkers([]);
      return;
    }
    markers.forEach((m) => {
      const arr = markersMapRef.current.get(m.ts) || [];
      arr.push(m);
      markersMapRef.current.set(m.ts, arr);
    });
    if (candleSeriesRef.current) {
      const formatted = markers.map((m) => ({
        time: m.ts as UTCTimestamp,
        position: m.side === 'buy' ? 'belowBar' : 'aboveBar',
        color: m.side === 'buy' ? '#34c759' : '#e13232',
        shape: m.side === 'buy' ? 'arrowUp' : 'arrowDown',
        text: m.clusterSize && m.clusterSize > 1 ? String(m.clusterSize) : undefined,
      }));
      candleSeriesRef.current.setMarkers(formatted);
    }
  }, [markers]);

  useEffect(() => {
    if (!pairId || !chain || !poolAddress) return;
    let candles: Candle[] = [];

    setIsLoading(true);
    candleSeriesRef.current?.setData([]);
    volumeSeriesRef.current?.setData([]);

    const poller = createPoller(async () => {
      try {
        const { data, meta } = await ohlc({ pairId, tf, chain, poolAddress });
        setMeta(meta);
        candles = data.candles;
        
        if (data.rollupHint === 'client' && data.tf !== tf) {
          candles = rollupCandles(candles, data.tf, tf);
        }
        
        setEffectiveTf(data.effectiveTf);
        const cleaned = toLWCandles(candles);
        
        if (candles.length > 0 && cleaned.length === candles.length) {
          // Transform data based on display mode
          const transformedData = cleaned.map((cd) => {
            // For market cap mode, we need totalSupply data from tokenDetail
            // Currently this is a placeholder until totalSupply is available in TokenResponse
            if (displayMode === 'marketcap' && tokenDetail?.info && false) {
              // TODO: Implement actual market cap calculation when totalSupply is available
              // const supply = Number(tokenDetail.info.totalSupply);
              const supply = 1000000000; // Placeholder for now
              return {
                time: cd.time as UTCTimestamp,
                open: cd.open * supply,
                high: cd.high * supply,
                low: cd.low * supply,
                close: cd.close * supply,
              };
            }
            return {
              time: cd.time as UTCTimestamp,
              open: cd.open,
              high: cd.high,
              low: cd.low,
              close: cd.close,
            };
          });
          
          const v = transformedData.map((cd) => {
            const src = candles.find((k) => Math.floor(Number(k.t)) === cd.time);
            const vol = src && Number.isFinite(Number(src.v)) ? Number(src.v) : 0;
            return {
              time: cd.time as UTCTimestamp,
              value: vol,
              color: cd.close >= cd.open ? '#34c759' : '#e13232',
            };
          });
          
          candleSeriesRef.current?.setData(transformedData);
          volumeSeriesRef.current?.setData(v);
          setHasData(true);
          setIsLoading(false);
          
          if (!sampleCandlesLoggedRef.current && DEBUG) {
            console.log('sample candles', candles.slice(0, 2).map((cd) => ({ t: cd.t, o: cd.o, h: cd.h, l: cd.l, c: cd.c })));
            sampleCandlesLoggedRef.current = true;
          }
        } else {
          setHasData(false);
          setIsLoading(false);
        }
        setProvider(data.provider);
      } catch (error) {
        setIsLoading(false);
        setDegraded(true);
      }
    }, 5000, {
      onError: () => {
        setDegraded(true);
        setIsLoading(false);
      },
      onRecover: () => setDegraded(false),
    });
    
    poller.start();

    const tradesPoller = createPoller(async () => {
      const { data: tr } = await trades({ pairId, chain, poolAddress, tokenAddress });
      if (tr && Array.isArray(tr.trades) && tr.trades.length > 0) {
        // noop: data is cached in trades() and used elsewhere
      }
    }, 3000, {
      onError: () => setDegraded(true),
      onRecover: () => setDegraded(false),
    });
    tradesPoller.start();

    return () => {
      poller.stop();
      tradesPoller.stop();
    };
  }, [pairId, tf, chain, poolAddress, tokenAddress, displayMode, tokenDetail]);

  useEffect(() => {
    if (!hasData && meta && !loggedRef.current && DEBUG) {
      console.log('no-data meta', meta);
      loggedRef.current = true;
    }
  }, [hasData, meta]);

  return (
    <div className="modern-chart-container" style={{ position: 'relative', height: '100%', minHeight: '400px' }}>
      {degraded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'var(--warning)',
            color: 'white',
            padding: '4px 8px',
            fontSize: '12px',
            textAlign: 'center',
            zIndex: 10,
            borderRadius: 'var(--radius-small)',
            margin: 'var(--space-2)',
          }}
        >
          Data feed degraded - retrying...
        </div>
      )}
      
      <div ref={containerRef} style={{ height: '100%', minHeight: '400px' }} />
      
      {/* Loading state */}
      {isLoading && (
        <ChartLoader 
          message={`Loading ${displayMode === 'marketcap' ? 'market cap' : 'price'} chart...`}
        />
      )}
      
      {/* No data state */}
      {!isLoading && !hasData && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 500 }}>No chart data available</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>
            {displayMode === 'marketcap' ? 'Market cap' : 'Price'} data not available for this timeframe
          </div>
          {meta && formatFetchMeta(meta) && (
            <div style={{ fontSize: '12px', opacity: 0.5, marginTop: 4 }}>
              {formatFetchMeta(meta)}
            </div>
          )}
        </div>
      )}
      
      {/* Hovered markers */}
      {hoveredMarkers && hoveredMarkers.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 8,
            top: 8,
            background: 'rgba(0,0,0,0.8)',
            color: 'var(--text)',
            padding: 'var(--space-2)',
            fontSize: '12px',
            zIndex: 5,
            borderRadius: 'var(--radius-small)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border)',
          }}
        >
          {hoveredMarkers.map((m, i) => {
            const link = explorerTemplate && m.txHash ? explorerTemplate.replace('{tx}', m.txHash) : undefined;
            return (
              <div key={i} style={{ marginBottom: i < hoveredMarkers.length - 1 ? 4 : 0 }}>
                <div style={{ 
                  color: m.side === 'buy' ? '#34c759' : '#e13232',
                  fontWeight: 600,
                }}>
                  {m.side.toUpperCase()} {m.size?.toFixed(2)} @ {formatUsd(m.price)}
                  {m.clusterSize && m.clusterSize > 1 ? ` (${m.clusterSize} trades)` : ''}
                </div>
                {m.walletShort && m.clusterSize === 1 && (
                  <div style={{ fontSize: '10px', opacity: 0.8 }}>{m.walletShort}</div>
                )}
                {link && m.clusterSize === 1 && (
                  <div>
                    <a 
                      href={link} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ 
                        color: 'var(--brand-primary)',
                        textDecoration: 'none',
                        fontSize: '10px'
                      }}
                    >
                      View Transaction →
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Chart info badges */}
      <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 'var(--space-1)' }}>
        {effectiveTf && effectiveTf !== tf && (
          <div
            style={{
              background: 'var(--bg-elev)',
              color: 'var(--warning)',
              padding: '2px 6px',
              fontSize: '10px',
              borderRadius: 'var(--radius-small)',
              border: '1px solid var(--border)',
            }}
          >
            Downgraded to {effectiveTf}
          </div>
        )}
        
        <div
          style={{
            background: 'var(--bg-elev)',
            color: 'var(--text-muted)',
            padding: '2px 6px',
            fontSize: '10px',
            borderRadius: 'var(--radius-small)',
            border: '1px solid var(--border)',
          }}
        >
          UTC • {effectiveTf || tf}
        </div>
      </div>
      
      {provider && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'var(--bg-elev)',
            color: 'var(--text-muted)',
            padding: '2px 6px',
            fontSize: '10px',
            borderRadius: 'var(--radius-small)',
            border: '1px solid var(--border)',
          }}
        >
          {provider}
        </div>
      )}
    </div>
  );
}

