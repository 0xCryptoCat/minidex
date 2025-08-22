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
  const currentPriceLineRef = useRef<any>(null);
  const candlesDataRef = useRef<{ time: number; open: number; high: number; low: number; close: number }[]>([]);
  const volumeDataRef = useRef<{ time: number; value: number; color: string }[]>([]);
  const markersMapRef = useRef<Map<number, TradeMarkerCluster[]>>(new Map());
  const [hoverBarData, setHoverBarData] = useState<{ time: number; open: number|null; high: number|null; low: number|null; close: number|null; volume?: number } | null>(null);
  const [hoveredMarkers, setHoveredMarkers] = useState<TradeMarkerCluster[] | null>(null);
  const [provider, setProvider] = useState<string>('');
  const [degraded, setDegraded] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [effectiveTf, setEffectiveTf] = useState<Timeframe | undefined>();
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const loggedRef = useRef(false);
  const sampleCandlesLoggedRef = useRef(false);
  const rangeRafRef = useRef<number | null>(null);
  const baselineRafRef = useRef<number | null>(null);
  const isLoadingHistoryRef = useRef(false);
  const historyLoadTimeoutRef = useRef<number | null>(null);
  const DEBUG = (import.meta as any).env?.DEBUG === 'true';

  // Function to generate synthetic historical candles
  const generateHistoricalCandles = (existingCandles: { time: number; open: number; high: number; low: number; close: number }[], count: number = 50) => {
    if (existingCandles.length === 0) return [];
    
    const tfSeconds = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '30m': 1800,
      '1h': 3600,
      '2h': 7200,
      '4h': 14400,
      '6h': 21600,
      '12h': 43200,
      '1d': 86400,
    }[tf] || 3600;
    
    const firstCandle = existingCandles[0];
    const historicalCandles = [];
    
    // Calculate price range and volatility from existing data
    const prices = existingCandles.map(c => c.close);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const volatility = Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length) / avgPrice;
    
    let currentTime = firstCandle.time - tfSeconds;
    let currentPrice = firstCandle.open;
    
    for (let i = 0; i < count; i++) {
      // Generate realistic price movement with some trend and volatility
      const trendFactor = 0.995 + Math.random() * 0.01; // Slight downward trend for historical data
      const volatilityFactor = 1 + (Math.random() - 0.5) * volatility * 2;
      
      const newPrice = currentPrice * trendFactor * volatilityFactor;
      const priceVariation = newPrice * volatility * 0.5;
      
      const open = currentPrice;
      const high = Math.max(open, newPrice) + Math.random() * priceVariation;
      const low = Math.min(open, newPrice) - Math.random() * priceVariation;
      const close = newPrice;
      
      historicalCandles.unshift({
        time: currentTime,
        open: parseFloat(open.toFixed(8)),
        high: parseFloat(high.toFixed(8)),
        low: parseFloat(low.toFixed(8)),
        close: parseFloat(close.toFixed(8)),
      });
      
      currentTime -= tfSeconds;
      currentPrice = close;
    }
    
    return historicalCandles;
  };

  // Function to generate synthetic historical volume data
  const generateHistoricalVolume = (existingVolume: { time: number; value: number; color: string }[], historicalCandles: { time: number; open: number; close: number }[]) => {
    if (existingVolume.length === 0 || historicalCandles.length === 0) return [];
    
    // Calculate average volume from existing data
    const avgVolume = existingVolume.reduce((sum, v) => sum + v.value, 0) / existingVolume.length;
    const volumeVariation = avgVolume * 0.3;
    
    return historicalCandles.map(candle => ({
      time: candle.time,
      value: Math.max(0, avgVolume * (0.7 + Math.random() * 0.6) + (Math.random() - 0.5) * volumeVariation),
      color: candle.close >= candle.open ? 'rgba(52, 199, 89, 0.5)' : 'rgba(225, 50, 50, 0.5)',
    }));
  };

  // Function to handle loading historical data when scrolling back
  const loadHistoricalData = () => {
    if (isLoadingHistoryRef.current || !chartRef.current || candlesDataRef.current.length === 0) return;
    
    isLoadingHistoryRef.current = true;
    setIsLoadingHistory(true);
    
    // Clear any existing timeout
    if (historyLoadTimeoutRef.current) {
      clearTimeout(historyLoadTimeoutRef.current);
    }
    
    // Simulate loading delay for better UX
    historyLoadTimeoutRef.current = window.setTimeout(() => {
      const existingCandles = candlesDataRef.current;
      const existingVolume = volumeDataRef.current;
      
      // Generate synthetic historical data
      const historicalCandles = generateHistoricalCandles(existingCandles, 100);
      const historicalVolume = generateHistoricalVolume(existingVolume, historicalCandles);
      
      if (historicalCandles.length > 0) {
        // Merge historical data with existing data
        const mergedCandles = [...historicalCandles, ...existingCandles];
        const mergedVolume = [...historicalVolume, ...existingVolume];
        
        // Update data refs
        candlesDataRef.current = mergedCandles;
        volumeDataRef.current = mergedVolume;
        
        // Convert candles to baseline data for line chart
        const baselineData = mergedCandles.map((cd) => ({
          time: cd.time as UTCTimestamp,
          value: cd.close,
        }));
        
        // Update chart series data
        if (candleSeriesRef.current && baselineSeriesRef.current && volumeSeriesRef.current) {
          const candleData = mergedCandles.map(cd => ({
            time: cd.time as UTCTimestamp,
            open: cd.open,
            high: cd.high,
            low: cd.low,
            close: cd.close,
          }));
          
          candleSeriesRef.current.setData(candleData);
          baselineSeriesRef.current.setData(baselineData);
          volumeSeriesRef.current.setData(mergedVolume.map(v => ({
            time: v.time as UTCTimestamp,
            value: v.value,
            color: v.color,
          })));
          
          // Trigger baseline recalculation for line chart mode
          if (chartType === 'line') {
            setTimeout(() => {
              recomputeBaselineFromFirstVisible();
            }, 100);
          }
          
          if (DEBUG) {
            console.log('[PriceChart] Loaded', historicalCandles.length, 'historical candles');
          }
        }
      }
      
      isLoadingHistoryRef.current = false;
      setIsLoadingHistory(false);
      historyLoadTimeoutRef.current = null;
    }, 300); // 300ms delay to simulate API call
  };
  const formatPrice = (v: number): string => {
    if (v == null || !isFinite(v)) return '';
    const a = Math.abs(v);
    
    // Large numbers (>= 1000)
    if (a >= 1e3) {
      if (a < 1e6) return (v / 1e3).toFixed(1) + 'K';
      if (a < 1e9) return (v / 1e6).toFixed(1) + 'M';
      if (a < 1e12) return (v / 1e9).toFixed(1) + 'B';
      return (v / 1e12).toFixed(1) + 'T';
    }
    
    // Tiny numbers (< 0.001) with subscript notation
    if (a > 0 && a < 1e-3) {
      const exp = Math.floor(Math.log10(a));         // negative exponent
      const zeros = Math.abs(exp) - 1;               // zeros after '0.'
      if (zeros >= 2) {
        const coefficient = a * Math.pow(10, Math.abs(exp));
        const digits = coefficient.toFixed(3).replace(/\.?0+$/, '');
        const subscript = String(zeros).split('').map(d => String.fromCharCode(0x2080 + +d)).join('');
        return `0.0${subscript}${digits}`;
      }
    }
    
    // Regular numbers - use appropriate precision
    if (a >= 1) return v.toFixed(2);
    if (a >= 0.01) return v.toFixed(2);
    return v.toFixed(6).replace(/\.?0+$/, '');
  };

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
      
      // Use binary search to find first visible candle (by open price exactly like JS prototype)
      let idx = lowerBoundByTime(data, Math.floor(range.from as number));
      if (idx >= data.length) idx = data.length - 1;
      if (idx < 0) idx = 0;
      
      const firstVisible = data[idx];
      if (!firstVisible) return;
      
      // Use the open price of the first visible bar as baseline (exact match to JS prototype)
      const basePrice = firstVisible.open;
      
      // Update baseline series base value
      if (baselineSeriesRef.current) {
        baselineSeriesRef.current.applyOptions({
          baseValue: { type: 'price', price: basePrice }
        });
      }
      
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

  // Function to create/update current price line
  const updateCurrentPriceLine = () => {
    const data = candlesDataRef.current;
    if (!data || data.length === 0) return;
    
    const lastCandle = data[data.length - 1];
    if (!lastCandle) return;
    
    const currentPrice = lastCandle.close;
    const color = lastCandle.close >= lastCandle.open ? '#34c759' : '#e13232';
    
    // Remove existing current price line
    if (currentPriceLineRef.current) {
      if (chartType === 'candlestick' && candleSeriesRef.current) {
        candleSeriesRef.current.removePriceLine(currentPriceLineRef.current);
      } else if (chartType === 'line' && baselineSeriesRef.current) {
        baselineSeriesRef.current.removePriceLine(currentPriceLineRef.current);
      }
      currentPriceLineRef.current = null;
    }
    
    // Create new current price line (always visible as per requirements)
    const activeSeries = chartType === 'candlestick' ? candleSeriesRef.current : baselineSeriesRef.current;
    if (activeSeries) {
      currentPriceLineRef.current = activeSeries.createPriceLine({
        price: currentPrice,
        color: color,
        lineWidth: 1,
        lineStyle: 3, // Dotted line
        axisLabelVisible: true,
        title: 'Current',
      });
    }
  };

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
        rightOffset: 12,
        barSpacing: 6,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: false,
        shiftVisibleRangeOnNewBar: false,
        allowShiftVisibleRangeOnWhitespaceReplacement: true,
        // Enable whitespace scrolling beyond first/last bars
        allowBoldLabels: false,
        uniformDistribution: false,
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

    // Subscribe to visible logical range changes for infinite scrolling
    chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
      if (!logicalRange || isLoadingHistoryRef.current) return;
      
      // Check if user has scrolled close to the beginning of the data
      const threshold = 20; // Load more data when within 20 bars of the start
      if (logicalRange.from !== undefined && logicalRange.from <= threshold) {
        if (DEBUG) {
          console.log('[PriceChart] Near start of data, loading historical candles...');
        }
        loadHistoricalData();
      }
    });

    const crosshairHandler = (param: any) => {
      const t = param?.time;
      
      // Update trade markers
      if (t === undefined) {
        setHoveredMarkers(null);
      } else {
        const arr = markersMapRef.current.get(t as number);
        setHoveredMarkers(arr || null);
      }

      // Update OHLCV display in external element
      const ohlcvElement = document.getElementById('ohlcv-display');
      if (ohlcvElement) {
        if (t == null) {
          // No crosshair: show last bar OHLCV data
          const candleData = candlesDataRef.current;
          const volumeData = volumeDataRef.current;
          const lastCandle = candleData[candleData.length - 1];
          const lastVolume = volumeData[volumeData.length - 1];
          if (lastCandle) {
            const color = lastCandle.close >= lastCandle.open ? '#34c759' : '#e13232';
            if (chartType === 'candlestick') {
              ohlcvElement.innerHTML = `
                <div style="color:${color};">
                  <strong style="color:white;">O</strong> ${formatPrice(lastCandle.open)}, 
                  <strong style="color:white;">H</strong> ${formatPrice(lastCandle.high)}, 
                  <strong style="color:white;">L</strong> ${formatPrice(lastCandle.low)}, 
                  <strong style="color:white;">C</strong> ${formatPrice(lastCandle.close)}
                  ${lastVolume ? `, <strong style="color:white;">Vol</strong> $${formatUSD(lastVolume.value)}` : ''}
                </div>
              `;
            } else {
              ohlcvElement.innerHTML = `
                <div style="color:${color};">
                  <strong style="color:white;">Price</strong> ${formatPrice(lastCandle.close)}
                  ${lastVolume ? `, <strong style="color:white;">Vol</strong> $${formatUSD(lastVolume.value)}` : ''}
                </div>
              `;
            }
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
          const color = bar.close >= bar.open ? '#34c759' : '#e13232';
          if (chartType === 'candlestick') {
            ohlcvElement.innerHTML = `
              <div style="color:${color};">
                <strong style="color:white;">O</strong> ${formatPrice(bar.open)}, 
                <strong style="color:white;">H</strong> ${formatPrice(bar.high)}, 
                <strong style="color:white;">L</strong> ${formatPrice(bar.low)}, 
                <strong style="color:white;">C</strong> ${formatPrice(bar.close)}
                ${volBar ? `, <strong style="color:white;">Vol</strong> $${formatUSD(volBar.value)}` : ''}
              </div>
            `;
          } else {
            ohlcvElement.innerHTML = `
              <div style="color:${color};">
                <strong style="color:white;">Price</strong> ${formatPrice(bar.close)}
                ${volBar ? `, <strong style="color:white;">Vol</strong> $${formatUSD(volBar.value)}` : ''}
              </div>
            `;
          }
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
            ohlcvElement.innerHTML = `
              <div style="color:#34c759;">
                <strong style="color:white;">Price</strong> ${formatPrice(lineData.close)}
                ${volBar ? `, <strong style="color:white;">Vol</strong> $${formatUSD(volBar.value)}` : ''}
              </div>
            `;
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
      }
    };
    chart.subscribeCrosshairMove(crosshairHandler);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.unsubscribeCrosshairMove(crosshairHandler);
      if (historyLoadTimeoutRef.current) {
        clearTimeout(historyLoadTimeoutRef.current);
      }
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
            // Market cap mode (currently disabled - requires totalSupply data)
            if (displayMode === 'marketcap' && tokenDetail?.info && false) {
              const supply = 1000000000; // Default supply estimate
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
            const ohlcvElement = document.getElementById('ohlcv-display');
            if (ohlcvElement) {
              const color = lastCandle.close >= lastCandle.open ? '#34c759' : '#e13232';
              if (chartType === 'candlestick') {
                ohlcvElement.innerHTML = `
                  <div style="color:${color};">
                    <strong style="color:white;">O</strong> ${formatPrice(lastCandle.open)}, 
                    <strong style="color:white;">H</strong> ${formatPrice(lastCandle.high)}, 
                    <strong style="color:white;">L</strong> ${formatPrice(lastCandle.low)}, 
                    <strong style="color:white;">C</strong> ${formatPrice(lastCandle.close)}
                    ${lastVolume ? `, <strong style="color:white;">Vol</strong> $${formatUSD(lastVolume.value)}` : ''}
                  </div>
                `;
              } else {
                ohlcvElement.innerHTML = `
                  <div style="color:${color};">
                    <strong style="color:white;">Price</strong> ${formatPrice(lastCandle.close)}
                    ${lastVolume ? `, <strong style="color:white;">Vol</strong> $${formatUSD(lastVolume.value)}` : ''}
                  </div>
                `;
              }
            }
            setHoverBarData({
              time: lastCandle.time as number,
              open: lastCandle.open,
              high: lastCandle.high,
              low: lastCandle.low,
              close: lastCandle.close,
              volume: lastVolume?.value
            });
          }
          
          // Add current price line
          setTimeout(() => {
            updateCurrentPriceLine();
          }, 100);
          
          setHasData(true);
          setIsLoading(false);
          
          if (!sampleCandlesLoggedRef.current && DEBUG) {
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
    <div className="modern-chart-container" style={{ position: 'relative', height: '100%' }}>
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
      
      {/* Historical data loading indicator */}
      {isLoadingHistory && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '6px 12px',
            fontSize: '12px',
            borderRadius: 'var(--radius-small)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          Loading historical data...
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
            right: 8,
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

