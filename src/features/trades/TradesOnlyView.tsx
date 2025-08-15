import { useEffect, useState, useMemo, ReactNode, CSSProperties } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { Trade } from '../../lib/types';
import { trades } from '../../lib/api';
import {
  formatUsd,
  formatAmount,
  formatShortAddr,
  formatDateTimeUTC,
  formatFetchMeta,
  type FetchMeta,
} from '../../lib/format';
import '../../styles/trades.css';

const ROW_HEIGHT = 52;

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

interface ColumnConfig {
  key: SortKey;
  header: string;
  accessor: (t: Trade) => any;
  render: (t: Trade) => ReactNode;
  comparator?: (a: any, b: any) => number;
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
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let cancelled = false;
    trades({ pairId, chain, poolAddress, tokenAddress })
      .then((data: any) => {
        if (cancelled) return;
        setRows(data.trades || []);
        setNoTrades(!data.trades || data.trades.length === 0);
        setMeta(data._meta);
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

  const columns: ColumnConfig[] = useMemo(
    () => [
      {
        key: 'time',
        header: 'Time',
        accessor: (t) => t.ts,
        render: (t) => (
          <>
            <div>{formatDateTimeUTC(t.ts)}</div>
            {t.blockNumber !== undefined && (
              <div className="muted">#{t.blockNumber}</div>
            )}
          </>
        ),
        comparator: (a: number, b: number) => a - b,
      },
      {
        key: 'side',
        header: 'Type',
        accessor: (t) => t.side,
        render: (t) => t.side,
        comparator: (a: string, b: string) => a.localeCompare(b),
      },
      {
        key: 'price',
        header: 'Price $',
        accessor: (t) => t.price,
        render: (t) => formatUsd(t.price, { compact: true }),
        comparator: (a: number | undefined, b: number | undefined) =>
          (a || 0) - (b || 0),
      },
      {
        key: 'total',
        header: 'Total $',
        accessor: (t) => (t.amountBase || 0) * (t.price || 0),
        render: (t) =>
          formatUsd((t.amountBase || 0) * (t.price || 0), { compact: true }),
        comparator: (a: number, b: number) => a - b,
      },
      {
        key: 'amountBase',
        header: `Amount ${baseSymbol || '1'}`,
        accessor: (t) => t.amountBase || 0,
        render: (t) => formatAmount(t.amountBase),
        comparator: (a: number, b: number) => a - b,
      },
      {
        key: 'amountQuote',
        header: `Amount ${quoteSymbol || '2'}`,
        accessor: (t) => t.amountQuote || 0,
        render: (t) => formatAmount(t.amountQuote),
        comparator: (a: number, b: number) => a - b,
      },
      {
        key: 'wallet',
        header: 'Maker',
        accessor: (t) => t.wallet || '',
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
        comparator: (a: string, b: string) => a.localeCompare(b),
      },
      {
        key: 'tx',
        header: 'TX',
        accessor: (t) => t.txHash || '',
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
        comparator: (a: string, b: string) => a.localeCompare(b),
      },
      {
        key: 'txCount',
        header: 'TX Sum',
        accessor: (t) => (t.wallet ? counts.get(t.wallet) || 0 : 0),
        render: (t) => {
          const cnt = t.wallet ? counts.get(t.wallet) || 0 : 0;
          return t.wallet ? (
            <span className="tr-pill">
              {cnt} {cnt === 1 ? 'trade' : 'trades'}
            </span>
          ) : (
            '-'
          );
        },
        comparator: (a: number, b: number) => a - b,
      },
    ],
    [baseSymbol, quoteSymbol, counts]
  );

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return rows;
    const arr = [...rows].sort((a, b) => {
      const av = col.accessor(a);
      const bv = col.accessor(b);
      const res = col.comparator
        ? col.comparator(av, bv)
        : av > bv
        ? 1
        : av < bv
        ? -1
        : 0;
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
    return (
      <div>
        <div>No recent trades (24h)</div>
        {meta && formatFetchMeta(meta) && (
          <div style={{ fontSize: '0.75rem' }}>{formatFetchMeta(meta)}</div>
        )}
      </div>
    );
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
        <List height={400} itemCount={sorted.length} itemSize={ROW_HEIGHT} width={910}>
          {Row}
        </List>
      </div>
    </div>
  );
}
