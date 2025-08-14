import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, type IChartApi, type UTCTimestamp } from 'lightweight-charts';
import type { Timeframe, Candle } from '../../lib/types';
import { ohlc, trades } from '../../lib/api';
import { createPoller } from '../../lib/polling';
import { rollupCandles } from '../../lib/time';
import type { TradeMarkerCluster } from '../trades/TradeMarkers';
import chains from '../../lib/chains.json';

interface Props {
  pairId: string;
  tf: Timeframe;
  xDomain: [number, number] | null;
  onXDomainChange?: (d: [number, number]) => void;
  markers?: TradeMarkerCluster[];
  chain?: string;
  poolAddress?: string;
  address?: string;
}

export default function PriceChart({
  pairId,
  tf,
  xDomain,
  onXDomainChange,
  markers = [],
  chain,
  poolAddress,
  address,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const markersMapRef = useRef<Map<number, TradeMarkerCluster[]>>(new Map());
  const [hoveredMarkers, setHoveredMarkers] = useState<TradeMarkerCluster[] | null>(null);
  const [provider, setProvider] = useState<string>('');
  const [degraded, setDegraded] = useState(false);
  const [hasData, setHasData] = useState(true);
  const [effectiveTf, setEffectiveTf] = useState<Timeframe | undefined>();

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
    if (xDomain && chartRef.current) {
      chartRef.current.timeScale().setVisibleRange({ from: xDomain[0] as any, to: xDomain[1] as any });
    }
  }, [xDomain]);

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

    const poller = createPoller(async () => {
      const data = await ohlc({ pairId, tf, chain, poolAddress, address });
      candles = data.candles;
      if (data.rollupHint === 'client' && data.tf !== tf) {
        candles = rollupCandles(candles, data.tf, tf);
      }
      setEffectiveTf(data.effectiveTf);
      if (candles.length > 0) {
        const c = candles.map((cd) => ({
          time: cd.t as UTCTimestamp,
          open: cd.o,
          high: cd.h,
          low: cd.l,
          close: cd.c,
        }));
        const v = candles.map((cd) => ({
          time: cd.t as UTCTimestamp,
          value: cd.v || 0,
          color: cd.c >= cd.o ? '#26a69a' : '#ef5350',
        }));
        candleSeriesRef.current?.setData(c);
        volumeSeriesRef.current?.setData(v);
        setHasData(true);
      } else {
        candleSeriesRef.current?.setData([]);
        volumeSeriesRef.current?.setData([]);
        setHasData(false);
      }
      setProvider(data.provider);
    }, 5000, {
      onError: () => setDegraded(true),
      onRecover: () => setDegraded(false),
    });
    poller.start();

    const tradesPoller = createPoller(async () => {
      const tr = await trades({ pairId, chain, poolAddress, address });
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
  }, [pairId, tf, chain, poolAddress]);

  return (
    <div style={{ position: 'relative' }}>
      {degraded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'rgba(255,0,0,0.2)',
            color: '#900',
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
            color: '#666',
            pointerEvents: 'none',
          }}
        >
          No chart data available
        </div>
      )}
      {hoveredMarkers && hoveredMarkers.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: 4,
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '4px',
            fontSize: '12px',
            zIndex: 2,
          }}
        >
          {hoveredMarkers.map((m, i) => {
            const link = explorerTemplate && m.txHash ? explorerTemplate.replace('{tx}', m.txHash) : undefined;
            return (
              <div key={i} style={{ marginBottom: 4 }}>
                <div style={{ color: m.side === 'buy' ? 'lime' : 'magenta' }}>
                  {m.side} {m.size?.toFixed(2)} @ ${m.price.toFixed(4)}
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
            background: '#000',
            color: '#fff',
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
            background: '#000',
            color: '#fff',
            padding: '2px 4px',
            fontSize: '10px',
            opacity: 0.7,
          }}
        >
          {provider}
        </div>
      )}
    </div>
  );
}

