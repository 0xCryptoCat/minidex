import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, type IChartApi, type UTCTimestamp } from 'lightweight-charts';
import type { Timeframe, Candle } from '../../lib/types';
import { ohlc, trades } from '../../lib/api';
import { formatFetchMeta, type FetchMeta, formatUsd } from '../../lib/format';
import { createPoller } from '../../lib/polling';
import { rollupCandles } from '../../lib/time';
import type { TradeMarkerCluster } from '../trades/TradeMarkers';
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

interface Props {
  pairId: string;
  tf: Timeframe;
  xDomain: [number, number] | null;
  onXDomainChange?: (d: [number, number]) => void;
  markers?: TradeMarkerCluster[];
  chain: string;
  poolAddress: string;
  tokenAddress: string;
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
    const chart = createChart(containerRef.current, { height: 300 });
    const candleSeries = chart.addCandlestickSeries();
    const volumeSeries = chart.addHistogramSeries({
      priceScaleId: '',
      priceFormat: { type: 'volume' },
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    function handleResize() {
      chart.applyOptions({ width: containerRef.current!.clientWidth });
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
        color: m.side === 'buy' ? '#32cd32' : '#ff00ff',
        shape: m.side === 'buy' ? 'arrowUp' : 'arrowDown',
        text: m.clusterSize && m.clusterSize > 1 ? String(m.clusterSize) : undefined,
      }));
      candleSeriesRef.current.setMarkers(formatted);
    }
  }, [markers]);

  useEffect(() => {
    if (!pairId || !chain || !poolAddress) return;
    let candles: Candle[] = [];

    candleSeriesRef.current?.setData([]);
    volumeSeriesRef.current?.setData([]);

    const poller = createPoller(async () => {
      const { data, meta } = await ohlc({ pairId, tf, chain, poolAddress });
      setMeta(meta);
      candles = data.candles;
      if (data.rollupHint === 'client' && data.tf !== tf) {
        candles = rollupCandles(candles, data.tf, tf);
      }
      setEffectiveTf(data.effectiveTf);
      const cleaned = toLWCandles(candles);
      if (candles.length > 0 && cleaned.length === candles.length) {
        const c = cleaned.map((cd) => ({
          time: cd.time as UTCTimestamp,
          open: cd.open,
          high: cd.high,
          low: cd.low,
          close: cd.close,
        }));
        const v = c.map((cd) => {
          const src = candles.find((k) => Math.floor(Number(k.t)) === cd.time);
          const vol = src && Number.isFinite(Number(src.v)) ? Number(src.v) : 0;
          return {
            time: cd.time as UTCTimestamp,
            value: vol,
            color: cd.close >= cd.open ? '#26a69a' : '#ef5350',
          };
        });
        candleSeriesRef.current?.setData(c);
        volumeSeriesRef.current?.setData(v);
        setHasData(true);
        if (!sampleCandlesLoggedRef.current && DEBUG) {
          console.log('sample candles', candles.slice(0, 2).map((cd) => ({ t: cd.t, o: cd.o, h: cd.h, l: cd.l, c: cd.c })));
          sampleCandlesLoggedRef.current = true;
        }
      } else {
        setHasData(false);
      }
      setProvider(data.provider);
    }, 5000, {
      onError: () => setDegraded(true),
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
  }, [pairId, tf, chain, poolAddress, tokenAddress]);

  useEffect(() => {
    if (!hasData && meta && !loggedRef.current && DEBUG) {
      console.log('no-data meta', meta);
      loggedRef.current = true;
    }
  }, [hasData, meta]);

  return (
    <div style={{ position: 'relative' }}>
      {degraded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'rgba(255,46,209,0.2)',
            color: 'var(--accent-magenta)',
            padding: '2px 4px',
            fontSize: '12px',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          degraded
        </div>
      )}
      <div ref={containerRef} style={{ height: 300 }} />
      {!hasData && (
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
          }}
        >
          <div>No chart data available</div>
          {meta && formatFetchMeta(meta) && (
            <div style={{ fontSize: '10px', marginTop: 4 }}>{formatFetchMeta(meta)}</div>
          )}
        </div>
      )}
      {hoveredMarkers && hoveredMarkers.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: 4,
            background: 'rgba(0,0,0,0.7)',
            color: 'var(--text)',
            padding: '4px',
            fontSize: '12px',
            zIndex: 2,
          }}
        >
          {hoveredMarkers.map((m, i) => {
            const link = explorerTemplate && m.txHash ? explorerTemplate.replace('{tx}', m.txHash) : undefined;
            return (
              <div key={i} style={{ marginBottom: 4 }}>
                <div style={{ color: m.side === 'buy' ? 'var(--accent-lime)' : 'var(--accent-magenta)' }}>
                  {m.side} {m.size?.toFixed(2)} @ {formatUsd(m.price)}
                  {m.clusterSize && m.clusterSize > 1 ? ` (${m.clusterSize})` : ''}
                </div>
                {m.walletShort && m.clusterSize === 1 && <div>{m.walletShort}</div>}
                {link && m.clusterSize === 1 && (
                  <div>
                    <a href={link} target="_blank" rel="noreferrer" style={{ color: '#4ea3ff' }}>
                      tx
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {effectiveTf && effectiveTf !== tf && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'var(--bg)',
            color: 'var(--text)',
            padding: '2px 4px',
            fontSize: '10px',
            opacity: 0.7,
          }}
        >
          TF downgraded to {effectiveTf}
        </div>
      )}
      {provider && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            background: 'var(--bg)',
            color: 'var(--text)',
            padding: '2px 4px',
            fontSize: '10px',
            opacity: 0.7,
          }}
        >
          {provider}
        </div>
      )}
      <div
        style={{
          fontSize: '10px',
          textAlign: 'center',
          marginTop: 4,
        }}
      >
        UTC | TF: {effectiveTf || tf}
      </div>
    </div>
  );
}

