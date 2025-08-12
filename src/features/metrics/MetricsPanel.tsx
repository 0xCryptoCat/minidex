import { useState, useEffect, useRef } from 'react';
import type { MetricKey, MetricSeries, Timeframe } from '../../lib/types';
import {
  getOHLCCache,
  getTradesCache,
} from '../../lib/cache';
import {
  rollingVolumeBase,
  liquidityUsd,
  atrLite,
  returnsZScore,
  tradesPerInterval,
  ric,
} from '../../lib/transforms';

interface Props {
  pairId: string;
  tf: Timeframe;
}

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'rollingVolumeBase', label: 'Rolling Volume' },
  { key: 'liquidityUsd', label: 'Liquidity' },
  { key: 'atrLite', label: 'ATR-lite' },
  { key: 'returnsZScore', label: 'Returns Z-Score' },
  { key: 'tradesPerInterval', label: 'Trades/Interval' },
];

function MetricChart({ series }: { series: MetricSeries }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let plot: any;
    let mounted = true;
    import('uplot').then((uPlot) => {
      if (!mounted) return;
      const data: any = [
        series.points.map((p) => p.t),
        series.points.map((p) => p.v),
      ];
      plot = new uPlot.default(
        {
          width: 200,
          height: 60,
          series: [{}, { stroke: 'cyan' }],
          axes: [{}, {}],
        },
        data,
        ref.current!
      );
    });
    return () => {
      mounted = false;
      if (plot) plot.destroy();
    };
  }, [series]);
  return <div ref={ref} />;
}

export default function MetricsPanel({ pairId, tf }: Props) {
  const [enabled, setEnabled] = useState<MetricKey[]>([]);
  const [seriesMap, setSeriesMap] = useState<
    Partial<Record<MetricKey, MetricSeries>
  >>({});

  const candles = getOHLCCache(`${pairId}:${tf}`)?.candles || [];
  const trades = getTradesCache(pairId)?.trades || [];

  function toggle(key: MetricKey) {
    if (enabled.includes(key)) {
      setEnabled(enabled.filter((k) => k !== key));
      setSeriesMap((prev) => {
        const { [key]: _omit, ...rest } = prev;
        return rest;
      });
      return;
    }
    setEnabled([...enabled, key]);
    ric(() => {
      let s: MetricSeries | undefined;
      switch (key) {
        case 'rollingVolumeBase':
          s = rollingVolumeBase(candles);
          break;
        case 'liquidityUsd':
          s = liquidityUsd(trades, tf);
          break;
        case 'atrLite':
          s = atrLite(candles);
          break;
        case 'returnsZScore':
          s = returnsZScore(candles);
          break;
        case 'tradesPerInterval':
          s = tradesPerInterval(trades, tf);
          break;
      }
      if (s) setSeriesMap((prev) => ({ ...prev, [key]: s! }));
    });
  }

  return (
    <div>
      {METRICS.map((m) => (
        <div key={m.key} style={{ marginBottom: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={enabled.includes(m.key)}
              onChange={() => toggle(m.key)}
            />{' '}
            {m.label}
          </label>
          {enabled.includes(m.key) && seriesMap[m.key] && (
            <MetricChart series={seriesMap[m.key]!} />
          )}
        </div>
      ))}
    </div>
  );
}
