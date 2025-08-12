import { useEffect, useRef, useState } from 'react';
import { createChart, type IChartApi, type UTCTimestamp } from 'lightweight-charts';
import type { Timeframe, Candle } from '../../lib/types';
import { ohlc, trades } from '../../lib/api';
import { createPoller } from '../../lib/polling';
import { rollupCandles } from '../../lib/time';

interface Props {
  pairId: string;
  tf: Timeframe;
  xDomain: [number, number] | null;
  onXDomainChange?: (d: [number, number]) => void;
}

export default function PriceChart({ pairId, tf, xDomain, onXDomainChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [provider, setProvider] = useState<string>('');
  const [degraded, setDegraded] = useState(false);

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
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (xDomain && chartRef.current) {
      chartRef.current.timeScale().setVisibleRange({ from: xDomain[0] as any, to: xDomain[1] as any });
    }
  }, [xDomain]);

  useEffect(() => {
    if (!pairId) return;
    let candles: Candle[] = [];

    const poller = createPoller(async () => {
      const data = await ohlc(pairId, tf);
      candles = data.candles;
      if (data.rollupHint === 'client' && data.tf !== tf) {
        candles = rollupCandles(candles, data.tf, tf);
      }
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
      setProvider(data.provider);
    }, 5000, {
      onError: () => setDegraded(true),
      onRecover: () => setDegraded(false),
    });
    poller.start();

    const tradesPoller = createPoller(async () => {
      await trades(pairId);
    }, 3000, {
      onError: () => setDegraded(true),
      onRecover: () => setDegraded(false),
    });
    tradesPoller.start();

    return () => {
      poller.stop();
      tradesPoller.stop();
    };
  }, [pairId, tf]);

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

