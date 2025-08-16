import { useEffect, useState, useMemo, ReactNode, CSSProperties, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { Trade } from '../../lib/types';
import { trades } from '../../lib/api';
import {
  formatUsd,
  formatAmount,
  formatShortAddr,
  formatCompactTime,
  formatSmartAmount,
  formatFetchMeta,
  type FetchMeta,
} from '../../lib/format';
import { addressUrl, txUrl } from '../../lib/explorer';
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
  | 'tx';

interface ColumnConfig {
  key: SortKey;
  header: string;
  accessor: (t: Trade) => any;
  render: (t: Trade) => ReactNode;
  comparator?: (a: any, b: any) => number;
  className?: string;
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
  const DEBUG = (import.meta as any).env?.DEBUG === 'true';
  const sampleTradesLoggedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    trades({ pairId, chain, poolAddress, tokenAddress })
      .then(({ data, meta }) => {
        if (cancelled) return;
        setRows(data.trades || []);
        setNoTrades(!data.trades || data.trades.length === 0);
        setMeta(meta);
        if (!sampleTradesLoggedRef.current && DEBUG && data.trades?.length) {
          console.log(
            'sample trades',
            data.trades.slice(0, 2).map((t) => ({
              ts: t.ts,
              side: t.side,
              price: t.price,
              amountBase: t.amountBase,
              amountQuote: t.amountQuote,
            }))
          );
          sampleTradesLoggedRef.current = true;
        }
      })
      .catch(() => {
        if (!cancelled) setNoTrades(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pairId, chain, poolAddress, tokenAddress]);

  const columns: ColumnConfig[] = useMemo(
    () => [
      {
        key: 'time',
        header: 'Time',
        accessor: (t) => t.ts,
        render: (t) => (
          <div className="time-cell">
            <div className="time-main">{formatCompactTime(t.ts)}</div>
            {t.blockNumber !== undefined && (
              <div className="time-block">#{t.blockNumber}</div>
            )}
          </div>
        ),
        comparator: (a: number, b: number) => a - b,
      },
      {
        key: 'price',
        header: 'Price',
        accessor: (t) => t.price,
        render: (t) => (
          <div className="price-cell">
            <div>${formatSmartAmount(t.price)}</div>
          </div>
        ),
        comparator: (a: number | undefined, b: number | undefined) =>
          (a || 0) - (b || 0),
      },
      {
        key: 'total',
        header: 'Total',
        accessor: (t) => (t.amountBase || 0) * (t.price || 0),
        render: (t) => (
          <div className="total-cell">
            <div>${formatSmartAmount((t.amountBase || 0) * (t.price || 0))}</div>
          </div>
        ),
        comparator: (a: number, b: number) => a - b,
      },
      {
        key: 'amountBase',
        header: `${baseSymbol || 'Base'}`,
        accessor: (t) => t.amountBase || 0,
        render: (t) => (
          <div className="amount-cell">
            <div>{formatSmartAmount(t.amountBase)}</div>
          </div>
        ),
        comparator: (a: number, b: number) => a - b,
      },
      {
        key: 'wallet',
        header: 'Maker',
        accessor: (t) => t.wallet || '',
        render: (t) =>
          t.wallet ? (
            <div className="maker-cell">
              <span className="maker-addr">{formatShortAddr(t.wallet)}</span>
              <div className="maker-actions">
                <ContentCopyIcon 
                  className="action-icon copy-icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(t.wallet || '');
                  }}
                />
                <a
                  className="action-link"
                  href={addressUrl(chain as any, t.wallet)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <OpenInNewIcon className="action-icon" />
                </a>
              </div>
            </div>
          ) : (
            <span className="no-data">-</span>
          ),
        comparator: (a: string, b: string) => a.localeCompare(b),
        className: 'maker',
      },
      {
        key: 'tx',
        header: 'TX',
        accessor: (t) => t.txHash || '',
        render: (t) =>
          t.txHash ? (
            <div className="tx-cell">
              <a
                className="action-link"
                href={txUrl(chain as any, t.txHash)!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <OpenInNewIcon className="action-icon" />
              </a>
            </div>
          ) : (
            <span className="no-data">-</span>
          ),
        comparator: (a: string, b: string) => a.localeCompare(b),
      },
    ],
    [baseSymbol, quoteSymbol, chain]
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
      <div 
        style={style} 
        className={`tr-row ${typeClass}`}
        onMouseEnter={(e) => {
          e.currentTarget.classList.add('hover');
        }}
        onMouseLeave={(e) => {
          e.currentTarget.classList.remove('hover');
        }}
        onClick={() => {
          // Optional: Add click handler for row selection
        }}
      >
        {columns.map((c) => (
          <div key={c.key} className={`tr-cell${c.className ? ' ' + c.className : ''}`}>
            {c.render(t)}
          </div>
        ))}
      </div>
    );
  };

  if (rows.length === 0 && noTrades) {
    return (
      <div className="no-data-container">
        <div className="no-data-message">No recent trades available</div>
        <div className="no-data-subtitle">Check back later for trading activity</div>
        {meta && formatFetchMeta(meta) && (
          <div className="fetch-meta">{formatFetchMeta(meta)}</div>
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
