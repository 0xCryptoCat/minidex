import { useEffect, useState, useMemo, ReactNode, CSSProperties } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { Trade } from '../../lib/types';
import { trades } from '../../lib/api';
import {
  formatUsd,
  formatAmount,
  formatShortAddr,
  formatTimeUTC,
} from '../../lib/format';
import '../../styles/trades.css';

interface Props {
  pairId: string;
  chain: string;
  poolAddress: string;
  tokenAddress: string;
  baseSymbol?: string;
  quoteSymbol?: string;
}

type SortKey =
  | 'time'
  | 'side'
  | 'price'
  | 'total'
  | 'amountBase'
  | 'amountQuote'
  | 'wallet'
  | 'tx'
  | 'txCount';

interface Column {
  key: SortKey;
  header: string;
  render: (t: Trade) => ReactNode;
  sort: (a: Trade, b: Trade) => number;
}

export default function TradesOnlyView({
  pairId,
  chain,
  poolAddress,
  tokenAddress,
  baseSymbol,
  quoteSymbol,
}: Props) {
  const [rows, setRows] = useState<Trade[]>([]);
  const [noTrades, setNoTrades] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let cancelled = false;
    trades({ pairId, chain, poolAddress, tokenAddress })
      .then((data) => {
        if (cancelled) return;
        setRows(data.trades || []);
        setNoTrades(!data.trades || data.trades.length === 0);
      })
      .catch(() => {
        if (!cancelled) setNoTrades(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pairId, chain, poolAddress, tokenAddress]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      if (r.wallet) m.set(r.wallet, (m.get(r.wallet) || 0) + 1);
    });
    return m;
  }, [rows]);

  const columns: Column[] = useMemo(
    () => [
      {
        key: 'time',
        header: 'Time',
        render: (t) => (
          <>
            <div>{formatTimeUTC(t.ts)}</div>
            {t.blockNumber !== undefined && (
              <div className="muted">#{t.blockNumber}</div>
            )}
          </>
        ),
        sort: (a, b) => a.ts - b.ts,
      },
      {
        key: 'side',
        header: 'Type',
        render: (t) => t.side,
        sort: (a, b) => a.side.localeCompare(b.side),
      },
      {
        key: 'price',
        header: 'Price $',
        render: (t) => formatUsd(t.price),
        sort: (a, b) => (a.price || 0) - (b.price || 0),
      },
      {
        key: 'total',
        header: 'Total $',
        render: (t) => formatUsd((t.amountBase || 0) * (t.price || 0)),
        sort: (a, b) =>
          (a.amountBase || 0) * (a.price || 0) -
          (b.amountBase || 0) * (b.price || 0),
      },
      {
        key: 'amountBase',
        header: `Amount ${baseSymbol || '1'}`,
        render: (t) => formatAmount(t.amountBase),
        sort: (a, b) => (a.amountBase || 0) - (b.amountBase || 0),
      },
      {
        key: 'amountQuote',
        header: `Amount ${quoteSymbol || '2'}`,
        render: (t) => formatAmount(t.amountQuote),
        sort: (a, b) => (a.amountQuote || 0) - (b.amountQuote || 0),
      },
      {
        key: 'wallet',
        header: 'Maker',
        render: (t) =>
          t.wallet ? (
            <a
              className="tr-link"
              href={`https://etherscan.io/address/${t.wallet}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {formatShortAddr(t.wallet)} ↗
            </a>
          ) : (
            '-'
          ),
        sort: (a, b) => (a.wallet || '').localeCompare(b.wallet || ''),
      },
      {
        key: 'tx',
        header: 'TX',
        render: (t) =>
          t.txHash ? (
            <a
              className="tr-link"
              href={`https://etherscan.io/tx/${t.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              ↗
            </a>
          ) : (
            '-'
          ),
        sort: () => 0,
      },
      {
        key: 'txCount',
        header: 'TX Sum',
        render: (t) => (t.wallet ? counts.get(t.wallet) || 0 : '-'),
        sort: (a, b) =>
          (a.wallet ? counts.get(a.wallet) || 0 : 0) -
          (b.wallet ? counts.get(b.wallet) || 0 : 0),
      },
    ],
    [baseSymbol, quoteSymbol, counts]
  );

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return rows;
    const arr = [...rows].sort((a, b) => {
      const res = col.sort(a, b);
      return sortDir === 'asc' ? res : -res;
    });
    return arr;
  }, [rows, sortKey, sortDir, columns]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const Row = ({ index, style }: { index: number; style: CSSProperties }) => {
    const t = sorted[index];
    const typeClass = t.side === 'buy' ? 'buy' : 'sell';
    return (
      <div style={style} className={`tr-row ${typeClass}`}>
        {columns.map((c) => (
          <div key={c.key} className="tr-cell">
            {c.render(t)}
          </div>
        ))}
      </div>
    );
  };

  if (rows.length === 0 && noTrades) {
    return <div>No recent trades (24h)</div>;
  }

  if (rows.length === 0) {
    return <div>Loading…</div>;
  }

  return (
    <div className="trades-scroll">
      <div className="trades-table">
        <div className="trades-header">
          {columns.map((c) => (
            <div
              key={c.key}
              className="tr-cell"
              onClick={() => handleSort(c.key)}
            >
              {c.header}
            </div>
          ))}
        </div>
        <List height={400} itemCount={sorted.length} itemSize={44} width={910}>
          {Row}
        </List>
      </div>
    </div>
  );
}
