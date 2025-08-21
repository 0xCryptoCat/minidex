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
  // New props for chart configuration
  chartType?: 'candlestick' | 'line';
  showVolume?: boolean;
  crosshairMode?: 'normal' | 'magnet';
  showGrid?: boolean;
  showCrosshairLabels?: boolean;
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
  chartType = 'candlestick',
  showVolume = true,
  crosshairMode = 'normal',
  showGrid = true,
  showCrosshairLabels = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const baselineSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const baselineGuideCandlesRef = useRef<any>(null);
  const baselineGuideLineRef = useRef<any>(null);
  const candlesDataRef = useRef<{ time: number; open: number; high: number; low: number; close: number }[]>([]);
  const volumeDataRef = useRef<{ time: number; value: number; color: string }[]>([]);
  const markersMapRef = useRef<Map<number, TradeMarkerCluster[]>>(new Map());
  const [hoverBarData, setHoverBarData] = useState<{ time: number; open: number|null; high: number|null; low: number|null; close: number|null; volume?: number } | null>(null);
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
  const baselineRafRef = useRef<number | null>(null);
  const DEBUG = (import.meta as any).env?.DEBUG === 'true';

  // Helper function for USD formatting in OHLCV display
  const formatUSD = (n: number | null): string => {
    if (n == null) return '-';
    const a = Math.abs(n);
    if (a >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(2);
  };

  // Helper function for binary search
  const lowerBoundByTime = (arr: { time: number }[], t: number) => {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].time < t) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  // Function to update baseline base price whenever visible range changes
  const recomputeBaselineFromFirstVisible = () => {
    if (baselineRafRef.current) return; // Prevent multiple RAF calls
    baselineRafRef.current = requestAnimationFrame(() => {
      baselineRafRef.current = null;
      if (!chartRef.current || chartType !== 'line') return;
      const range = chartRef.current.timeScale().getVisibleRange();
      if (!range || range.from === undefined) return;
      const data = candlesDataRef.current;
      if (!data || data.length === 0) return;
      let idx = lowerBoundByTime(data, range.from as number);
      if (idx > data.length - 1) idx = data.length - 1;
      const first = data[idx];
      if (!first) return;
      const basePrice = first.open;
      
      // Update baseline series base value
      baselineSeriesRef.current?.applyOptions({
        baseValue: { type: 'price', price: basePrice }
      });
      
      // Recreate guide line on active series
      recreateGuideLines(basePrice);
    });
  };

  // Function to create price guide lines
  const createGuideLineOn = (series: any, price: number) => {
    return series?.createPriceLine({
      price,
      color: '#ffffff',
      lineWidth: 1,
      lineStyle: 2, // Dotted
      axisLabelVisible: true,
    });
  };

  // Function to recreate guide lines based on current mode
  const recreateGuideLines = (basePrice: number) => {
    // Remove existing guide lines
    if (baselineGuideCandlesRef.current && candleSeriesRef.current) {
      candleSeriesRef.current.removePriceLine(baselineGuideCandlesRef.current);
      baselineGuideCandlesRef.current = null;
    }
    if (baselineGuideLineRef.current && baselineSeriesRef.current) {
      baselineSeriesRef.current.removePriceLine(baselineGuideLineRef.current);
      baselineGuideLineRef.current = null;
    }

    // Create new guide line on active series
    if (chartType === 'candlestick' && candleSeriesRef.current) {
      baselineGuideCandlesRef.current = createGuideLineOn(candleSeriesRef.current, basePrice);
    } else if (chartType === 'line' && baselineSeriesRef.current) {
      baselineGuideLineRef.current = createGuideLineOn(baselineSeriesRef.current, basePrice);
    }
  };

  const explorerTemplate = useMemo(() => {
    if (!chain) return undefined;
    const entry: any = (chains as any[]).find((c) => c.slug === chain);
    return entry?.explorerTx as string | undefined;
  }, [chain]);

  // Enhanced price formatter with K/M/B/T abbreviations and subscript notation for tiny values
  const formatPrice = (v: number): string => {
    if (v == null || !isFinite(v)) return '';
    const a = Math.abs(v);
    if (a >= 1e3) {
      if (a < 1e6) return (v / 1e3).toFixed(1) + 'K';
      if (a < 1e9) return (v / 1e6).toFixed(1) + 'M';
      if (a < 1e12) return (v / 1e9).toFixed(1) + 'B';
      return (v / 1e12).toFixed(1) + 'T';
    }
    if (a > 0 && a < 1e-4) {
      const exp = Math.floor(Math.log10(a));         // negative
      const zeros = Math.abs(exp) - 1;               // zeros after '0.'
      if (zeros >= 3) {
        const sub = zeros - 1;                       // we render 0.0ₓ…
        const sci = v.toExponential(3);              // "1.23e-5"
        const mantissa = sci.split('e')[0].replace('.', ''); // "123"
        const subscript = String(sub).split('').map(d => String.fromCharCode(0x2080 + +d)).join('');
        return `0.0${subscript}${mantissa}`;
      }
    }
    return String(v.toFixed(4)).replace(/\.?0+$/, '');
  };

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
      localization: { priceFormatter: formatPrice },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.1)', visible: showGrid },
        horzLines: { color: 'rgba(255, 255, 255, 0.1)', visible: showGrid },
      },
      crosshair: {
        mode: crosshairMode === 'magnet' ? 2 : 1, // Magnet or Normal crosshair mode
        vertLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          style: 2, // Dashed line
          labelVisible: showCrosshairLabels,
          labelBackgroundColor: '#333',
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          style: 2, // Dashed line
          labelVisible: showCrosshairLabels,
          labelBackgroundColor: '#333',
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        rightOffset: 12, // Better mobile spacing
        barSpacing: 6, // Tighter spacing for mobile
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: false,
        // Better mobile scroll behavior - allow scrolling beyond data
        shiftVisibleRangeOnNewBar: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.2 : 0.1, // Dynamic bottom margin based on volume
        },
        entireTextOnly: false,
        minimumWidth: 60, // Compact for mobile
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
      lastValueVisible: false,
      priceLineVisible: false,
      priceFormat: { type: 'price', minMove: 0.00000001, precision: 8 },
    });
    
    // Add baseline series for line chart mode (area line with dual-color fill)
    const baselineSeries = chart.addBaselineSeries({
      baseValue: { type: 'price', price: 0 }, // will be updated dynamically
      topLineColor: '#34c759',
      bottomLineColor: '#e13232',
      topFillColor1: 'rgba(52,199,89,0.75)',
      topFillColor2: 'rgba(52,199,89,0.00)',
      bottomFillColor1: 'rgba(225,50,50,0.00)',
      bottomFillColor2: 'rgba(225,50,50,0.75)',
      lastValueVisible: false,
      priceLineVisible: false,
      priceFormat: { type: 'price', minMove: 0.00000001, precision: 8 },
    });
    baselineSeries.applyOptions({ visible: chartType === 'line' }); // show based on chart type
    
    // Add volume histogram series with theme colors
    const volumeSeries = chart.addHistogramSeries({
      priceScaleId: '',
      priceFormat: { type: 'volume' },
      color: 'rgba(255, 255, 255, 0.2)',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
      borderColor: 'rgba(255, 255, 255, 0.1)',
    });
    
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    baselineSeriesRef.current = baselineSeries;
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

    chart.timeScale().subscribeVisibleTimeRangeChange(recomputeBaselineFromFirstVisible);

    const crosshairHandler = (param: any) => {
      const t = param?.time;
      
      // Update trade markers
      if (t === undefined) {
        setHoveredMarkers(null);
      } else {
        const arr = markersMapRef.current.get(t as number);
        setHoveredMarkers(arr || null);
      }

      // Update OHLCV display
      if (t == null) {
        // No crosshair: show last bar (candles preferred, fallback to line)
        const candleData = candlesDataRef.current;
        const volumeData = volumeDataRef.current;
        const lastCandle = candleData[candleData.length - 1];
        const lastVolume = volumeData[volumeData.length - 1];
        if (lastCandle) {
          setHoverBarData({
            time: lastCandle.time,
            open: lastCandle.open,
            high: lastCandle.high,
            low: lastCandle.low,
            close: lastCandle.close,
            volume: lastVolume?.value
          });
        }
        return;
      }
      
      // Find bar at time t
      const candleData = candlesDataRef.current;
      const volumeData = volumeDataRef.current;
      const bar = candleData.find(b => b.time === t);
      const volBar = volumeData.find(v => v.time === t);
      
      if (bar) {
        setHoverBarData({
          time: bar.time,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: volBar?.value
        });
      } else {
        // Fallback for line mode - create synthetic bar data
        const lineData = candleData.find(c => c.time === t);
        if (lineData) {
          setHoverBarData({
            time: t,
            open: null,
            high: null,
            low: null,
            close: lineData.close,
            volume: volBar?.value
          });
        }
      }
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
              color: cd.close >= cd.open ? 'rgba(52, 199, 89, 0.5)' : 'rgba(225, 50, 50, 0.5)',
            };
          });
          
          // Store data in refs for baseline calculations
          candlesDataRef.current = transformedData;
          volumeDataRef.current = v;
          
          // Convert candles to baseline data (using close prices)
          const baselineData = transformedData.map((cd) => ({
            time: cd.time as UTCTimestamp,
            value: cd.close,
          }));
          
          // Update series data
          candleSeriesRef.current?.setData(transformedData);
          baselineSeriesRef.current?.setData(baselineData);
          volumeSeriesRef.current?.setData(v);
          
          // Trigger baseline recalculation for line chart mode
          if (chartType === 'line') {
            setTimeout(() => {
              recomputeBaselineFromFirstVisible();
            }, 100);
          }
          
          // Initialize OHLCV display with last candle
          const lastCandle = transformedData[transformedData.length - 1];
          const lastVolume = v[v.length - 1];
          if (lastCandle) {
            setHoverBarData({
              time: lastCandle.time as number,
              open: lastCandle.open,
              high: lastCandle.high,
              low: lastCandle.low,
              close: lastCandle.close,
              volume: lastVolume?.value
            });
          }
          
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

  // Effect to handle chart type and volume visibility changes
  useEffect(() => {
    if (!candleSeriesRef.current || !baselineSeriesRef.current || !volumeSeriesRef.current) return;
    
    // Update series visibility based on chart type
    candleSeriesRef.current.applyOptions({ visible: chartType === 'candlestick' });
    baselineSeriesRef.current.applyOptions({ visible: chartType === 'line' });
    volumeSeriesRef.current.applyOptions({ visible: showVolume });
    
    // Update volume scale margins
    volumeSeriesRef.current.priceScale().applyOptions({
      scaleMargins: showVolume ? { top: 0.8, bottom: 0 } : { top: 0, bottom: 0 },
    });
    
    // Update main price scale bottom margin
    if (chartRef.current) {
      chartRef.current.applyOptions({
        rightPriceScale: {
          scaleMargins: {
            top: 0.1,
            bottom: showVolume ? 0.2 : 0.1,
          },
        },
      });
    }
    
    // Trigger baseline recalculation and guide line updates
    if (hasData) {
      setTimeout(() => {
        recomputeBaselineFromFirstVisible();
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      }, 100);
    }
  }, [chartType, showVolume, hasData]);

  // Effect to handle grid and crosshair visibility changes
  useEffect(() => {
    if (!chartRef.current) return;
    
    chartRef.current.applyOptions({
      grid: {
        vertLines: { visible: showGrid },
        horzLines: { visible: showGrid },
      },
      crosshair: {
        vertLine: { labelVisible: showCrosshairLabels },
        horzLine: { labelVisible: showCrosshairLabels },
      },
    });
  }, [showGrid, showCrosshairLabels]);

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
      
      {/* OHLCV Info Panel */}
      {hasData && hoverBarData && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'var(--text)',
            padding: '6px 12px',
            fontSize: '12px',
            fontFamily: 'monospace',
            borderRadius: '6px',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 5,
          }}
        >
          {hoverBarData.open !== null ? (
            // Candlestick mode - show OHLC
            <div style={{ 
              color: hoverBarData.close !== null && hoverBarData.open !== null && hoverBarData.close >= hoverBarData.open ? '#34c759' : '#e13232' 
            }}>
              <strong style={{ color: 'white' }}>O</strong> {formatPrice(hoverBarData.open)}, {' '}
              <strong style={{ color: 'white' }}>H</strong> {formatPrice(hoverBarData.high!)}, {' '}
              <strong style={{ color: 'white' }}>L</strong> {formatPrice(hoverBarData.low!)}, {' '}
              <strong style={{ color: 'white' }}>C</strong> {formatPrice(hoverBarData.close!)}, {' '}
              <strong style={{ color: 'white' }}>Vol</strong> ${hoverBarData.volume ? formatUSD(hoverBarData.volume) : '-'}
            </div>
          ) : (
            // Line mode - show close price only
            <div style={{ 
              color: '#34c759' // Default line color
            }}>
              <strong style={{ color: 'white' }}>Price</strong> {formatPrice(hoverBarData.close!)}, {' '}
              <strong style={{ color: 'white' }}>Vol</strong> ${hoverBarData.volume ? formatUSD(hoverBarData.volume) : '-'}
            </div>
          )}
        </div>
      )}
      
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
    </div>
  );
}

