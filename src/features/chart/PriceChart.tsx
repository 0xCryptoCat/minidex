import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, type IChartApi, type UTCTimestamp } from 'lightweight-charts';
import type { Timeframe, Candle, TokenResponse, PoolDetail } from '../../lib/types';
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
  pools?: PoolDetail[]; // Pool data for market cap calculation
  displayMode?: DisplayMode;
  onDisplayModeChange?: (mode: DisplayMode) => void;
  // New props for chart configuration
  chartType?: 'candlestick' | 'line';
  showVolume?: boolean;
  crosshairMode?: 'normal' | 'magnet';
  showGrid?: boolean;
  showCrosshairLabels?: boolean;
  // Callbacks for chart data
  onVolumeChange?: (volume: number) => void;
  onBaselinePercentChange?: (percent: number) => void;
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
  pools = [],
  displayMode = 'price',
  onDisplayModeChange,
  chartType = 'candlestick',
  showVolume = true,
  crosshairMode = 'normal',
  showGrid = true,
  showCrosshairLabels = true,
  onVolumeChange,
  onBaselinePercentChange,
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
  const [effectiveTf, setEffectiveTf] = useState<Timeframe | undefined>();
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const loggedRef = useRef(false);
  const sampleCandlesLoggedRef = useRef(false);
  const rangeRafRef = useRef<number | null>(null);
  const baselineRafRef = useRef<number | null>(null);
  const lastBaselineIndexRef = useRef<number>(-1); // Track last baseline index to prevent rapid toggling
  const isLoadingHistoryRef = useRef<boolean>(false); // Prevent overlapping history loads
  const DEBUG = (import.meta as any).env?.DEBUG === 'true';


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
    return v.toFixed(4).replace(/\.?0+$/, '');
  };

  // Create USD currency formatter for proper price display
  const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2, // Reduced from 5 to 2 for cleaner display
  });

  // Custom price formatter that handles both price and market cap modes
  const customPriceFormatter = (price: number): string => {
    if (displayMode === 'marketcap') {
      // For market cap, use formatPrice logic with dollar sign
      return `$${formatPrice(price)}`;
    } else {
      // For price mode, use USD formatting but with custom logic for small values
      if (price >= 0.01) {
        return usdFormatter.format(price);
      } else {
        // For very small prices, use custom formatting
        return `$${formatPrice(price)}`;
      }
    }
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
  // Fix: Remove chartType dependency and always recompute baseline
  // Add debouncing to prevent rapid scale changes
  const recomputeBaselineFromFirstVisible = () => {
    if (baselineRafRef.current) return; // Prevent multiple RAF calls
    baselineRafRef.current = requestAnimationFrame(() => {
      baselineRafRef.current = null;
      if (!chartRef.current) return;
      
      const range = chartRef.current.timeScale().getVisibleRange();
      if (!range || range.from === undefined) return;
      
      const data = candlesDataRef.current;
      if (!data || data.length === 0) return;
      
      // Use binary search to find first visible candle (by open price exactly like JS prototype)
      let idx = lowerBoundByTime(data, Math.floor(range.from as number));
      if (idx >= data.length) idx = data.length - 1;
      if (idx < 0) idx = 0;
      
      // Debouncing: Only update if the baseline index has changed significantly
      // This prevents rapid toggling when a candle is partially visible
      if (Math.abs(idx - lastBaselineIndexRef.current) < 1) {
        return; // Skip update if index hasn't changed by a full candle
      }
      
      const firstVisible = data[idx];
      if (!firstVisible) return;
      
      // Update the last baseline index
      lastBaselineIndexRef.current = idx;
      
      // Use the open price of the first visible bar as baseline (exact match to JS prototype)
      const basePrice = firstVisible.open;
      
      // Update baseline series base value
      if (baselineSeriesRef.current) {
        baselineSeriesRef.current.applyOptions({
          baseValue: { type: 'price', price: basePrice }
        });
      }
      
      // Recreate guide line on active series - get current mode from refs
      const currentMode = candleSeriesRef.current?.options()?.visible ? 'candlestick' : 'line';
      recreateGuideLines(basePrice, currentMode);
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
  const recreateGuideLines = (basePrice: number, currentMode?: string) => {
    // Get current mode if not provided
    const mode = currentMode || (candleSeriesRef.current?.options()?.visible ? 'candlestick' : 'line');
    
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
    if (mode === 'candlestick' && candleSeriesRef.current) {
      baselineGuideCandlesRef.current = createGuideLineOn(candleSeriesRef.current, basePrice);
    } else if (mode === 'line' && baselineSeriesRef.current) {
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
        title: '',
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
      localization: { 
        priceFormatter: customPriceFormatter 
      },
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
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        autoScale: true,
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
    // Use dedicated price scale to prevent scale conflicts with candlestick series
    const baselineSeries = chart.addBaselineSeries({
      priceScaleId: 'baseline', // Use dedicated scale to prevent conflicts
      baseValue: { type: 'price', price: 0 }, // will be updated dynamically
      topLineColor: '#34c759', // --buy-primary
      bottomLineColor: '#e13232', // --sell-primary
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
    
    // Configure the dedicated baseline price scale to prevent scale conflicts
    const baselinePriceScale = chart.priceScale('baseline');
    baselinePriceScale.applyOptions({
      autoScale: true,
      visible: false, // Don't show a second axis
      scaleMargins: {
        top: 0.1,
        bottom: showVolume ? 0.2 : 0.1,
      },
      borderColor: 'rgba(255, 255, 255, 0.2)',
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

    // Add infinite scroll for historical data loading
    const infiniteScrollHandler = (logicalRange: any) => {
      if (!logicalRange || isLoadingHistoryRef.current) return;
      
      // Load more history when user scrolls close to the left edge
      const threshold = 20; // bars from the edge to trigger loading
      if (logicalRange.from <= threshold) {
        isLoadingHistoryRef.current = true;
        
        // TODO: Implement actual historical data loading
        // For now, we'll just set a timeout to reset the loading flag
        // In a real implementation, you would:
        // 1. Calculate the timestamp for older data
        // 2. Fetch historical candles before the current earliest timestamp
        // 3. Prepend the data to candlesDataRef.current and volumeDataRef.current
        // 4. Call setData on the series with the combined data
        // 5. Preserve the current logical position to avoid jumping
        
        setTimeout(() => {
          isLoadingHistoryRef.current = false;
        }, 1000);
      }
    };
    
    chart.timeScale().subscribeVisibleLogicalRangeChange(infiniteScrollHandler);

    const crosshairHandler = (param: any) => {
      const t = param?.time;
      
      // Update trade markers
      if (t === undefined) {
        setHoveredMarkers(null);
      } else {
        const arr = markersMapRef.current.get(t as number);
        setHoveredMarkers(arr || null);
      }

      // Calculate and emit baseline percentage and volume for parent component
      const candleData = candlesDataRef.current;
      const volumeData = volumeDataRef.current;
      
      if (t == null) {
        // No crosshair: use last bar data
        const lastCandle = candleData[candleData.length - 1];
        const lastVolume = volumeData[volumeData.length - 1];
        
        if (lastCandle && onBaselinePercentChange) {
          // Get current baseline from chart
          const range = chartRef.current?.timeScale().getVisibleRange();
          if (range && range.from !== undefined) {
            let idx = lowerBoundByTime(candleData, Math.floor(range.from as number));
            if (idx >= candleData.length) idx = candleData.length - 1;
            if (idx < 0) idx = 0;
            const firstVisible = candleData[idx];
            if (firstVisible) {
              const basePrice = firstVisible.open;
              const currentPrice = lastCandle.close;
              const percent = ((currentPrice - basePrice) / basePrice) * 100;
              onBaselinePercentChange(percent);
            }
          }
        }
        
        if (lastVolume && onVolumeChange) {
          onVolumeChange(lastVolume.value);
        }
      } else {
        // Use crosshair bar data
        const bar = candleData.find(b => b.time === t);
        const volBar = volumeData.find(v => v.time === t);
        
        if (bar && onBaselinePercentChange) {
          // Get current baseline from chart
          const range = chartRef.current?.timeScale().getVisibleRange();
          if (range && range.from !== undefined) {
            let idx = lowerBoundByTime(candleData, Math.floor(range.from as number));
            if (idx >= candleData.length) idx = candleData.length - 1;
            if (idx < 0) idx = 0;
            const firstVisible = candleData[idx];
            if (firstVisible) {
              const basePrice = firstVisible.open;
              const currentPrice = bar.close;
              const percent = ((currentPrice - basePrice) / basePrice) * 100;
              onBaselinePercentChange(percent);
            }
          }
        }
        
        if (volBar && onVolumeChange) {
          onVolumeChange(volBar.value);
        }
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
              // Be sure the OHLCV decimals are at max 3 decimals for USD values
              ohlcvElement.innerHTML = `
                <div style="color:${color};">
                  <strong style="color:white;">O</strong> ${formatPrice(lastCandle.open)}
                  <strong style="color:white;">H</strong> ${formatPrice(lastCandle.high)}
                  <strong style="color:white;">L</strong> ${formatPrice(lastCandle.low)}
                  <strong style="color:white;">C</strong> ${formatPrice(lastCandle.close)}
                  ${lastVolume ? `<strong style="color:white;">Vol</strong> $${formatUSD(lastVolume.value)}` : ''}
                </div>
              `;
            } else {
              ohlcvElement.innerHTML = `
                <div style="color:${color};">
                  <strong style="color:white;">Price</strong> ${formatPrice(lastCandle.close)}
                  ${lastVolume ? `<strong style="color:white;">Vol</strong> $${formatUSD(lastVolume.value)}` : ''}
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
      chart.timeScale().unsubscribeVisibleTimeRangeChange(recomputeBaselineFromFirstVisible);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(infiniteScrollHandler);
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
        
        if (DEBUG) {
          console.log(`[PriceChart] Fetched data for tf=${tf}, got tf=${data.tf}, rollupHint=${data.rollupHint}, candles=${candles.length}`);
        }
        
        if (data.rollupHint === 'client' && data.tf !== tf) {
          if (DEBUG) {
            console.log(`[PriceChart] Rolling up candles from ${data.tf} to ${tf}`);
          }
          candles = rollupCandles(candles, data.tf, tf);
          if (DEBUG) {
            console.log(`[PriceChart] After rollup: ${candles.length} candles`);
          }
        }
        
        setEffectiveTf(data.effectiveTf);
        const cleaned = toLWCandles(candles);
        
        if (candles.length > 0 && cleaned.length === candles.length) {
          // Transform data based on display mode          
          const transformedData = cleaned.map((cd) => {
            // Market cap mode - calculate market cap using pool's market cap as reference
            if (displayMode === 'marketcap' && tokenDetail && pools && pools.length > 0) {
              // Find the active pool's market cap for calculation
              const activePool = pools.find(p => p.poolAddress === poolAddress) || pools[0];
              if (activePool?.marketCap && activePool?.priceUsd) {
                // Calculate supply from market cap and current price: supply = marketCap / priceUsd
                const calculatedSupply = activePool.marketCap / activePool.priceUsd;
                return {
                  time: cd.time as UTCTimestamp,
                  open: cd.open * calculatedSupply,
                  high: cd.high * calculatedSupply,
                  low: cd.low * calculatedSupply,
                  close: cd.close * calculatedSupply,
                };
              }
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
          
          // Fit content only on first load for better initial view
          if (chartRef.current && transformedData.length > 0 && !hasData) {
            chartRef.current.timeScale().fitContent();
            
            // Add some right margin after fitting to allow future scrolling
            setTimeout(() => {
              if (chartRef.current) {
                const range = chartRef.current.timeScale().getVisibleLogicalRange();
                if (range) {
                  // Shift view slightly left to reveal some whitespace on the right
                  chartRef.current.timeScale().setVisibleLogicalRange({
                    from: Math.max(0, range.from - 5), // Move 5 bars left, but not negative
                    to: range.to
                  });
                }
              }
            }, 50);
          }
          
          // Trigger baseline recalculation for all modes (not just line)
          setTimeout(() => {
            recomputeBaselineFromFirstVisible();
          }, 100);
          
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
          autoScale: true,
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
        // Note: Removed fitContent call here - only fit on explicit user action or data change
      }, 100);
    }
  }, [chartType, showVolume, hasData]);

  // Effect to handle display mode changes (price vs market cap) and trigger auto-scaling
  useEffect(() => {
    if (!chartRef.current || !hasData) return;
    
    // Update the price formatter in chart options
    chartRef.current.applyOptions({
      localization: { 
        priceFormatter: customPriceFormatter 
      },
    });
    
    // Force auto-scale when switching between price and market cap modes
    // since they have vastly different scales
    setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }, 50);
  }, [displayMode, hasData]);

  // Effect to handle grid and crosshair visibility changes
  useEffect(() => {
    if (!chartRef.current) return;
    
    chartRef.current.applyOptions({
      grid: {
        vertLines: { visible: showGrid },
        horzLines: { visible: showGrid },
      },
      crosshair: {
        mode: crosshairMode === 'magnet' ? 2 : 1, // Update crosshair mode
        vertLine: { labelVisible: showCrosshairLabels },
        horzLine: { labelVisible: showCrosshairLabels },
      },
    });
  }, [showGrid, showCrosshairLabels, crosshairMode]);

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

