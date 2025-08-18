import { useEffect, useState, useMemo, ReactNode, CSSProperties, useRef } from 'react';
import { VariableSizeList as List } from 'react-window';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import type { Trade } from '../../lib/types';
import { trades } from '../../lib/api';
import {
  formatUsd,
  formatAmount,
  formatShortAddr,
  formatCompactTime,
  formatSmartAmountReact,
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
  | 'wallet';

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
  const [containerHeight, setContainerHeight] = useState(400);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Measure container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 100; // Leave some margin
        setContainerHeight(Math.max(availableHeight, 300));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const columns: ColumnConfig[] = useMemo(
    () => [
      {
        key: 'time',
        header: 'Time',
        accessor: (t) => t.ts,
        render: (t) => (
          <div className="time-cell">
            <div className="time-main">{formatCompactTime(t.ts)}</div>
            <div className="time-ago">ago</div>
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
            <div>${formatSmartAmountReact(t.price)}</div>
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
            <div>${formatSmartAmountReact((t.amountBase || 0) * (t.price || 0))}</div>
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
            <div>{formatSmartAmountReact(t.amountBase)}</div>
          </div>
        ),
        comparator: (a: number, b: number) => a - b,
      },
      {
        key: 'amountQuote',
        header: `${quoteSymbol || 'Quote'}`,
        accessor: (t) => t.amountQuote || 0,
        render: (t) => (
          <div className="amount-cell">
            <div>{formatSmartAmountReact(t.amountQuote)}</div>
          </div>
        ),
        comparator: (a: number, b: number) => a - b,
      },
      {
        key: 'wallet',
        header: 'Maker',
        accessor: (t) => t.wallet || '',
        render: (t) => (
          <div className="maker-cell">
            <span className="maker-addr" style={{ whiteSpace: 'nowrap' }}>
              {formatShortAddr(t.wallet)}
            </span>
          </div>
        ),
        comparator: (a: string, b: string) => a.localeCompare(b),
        className: 'maker-column',
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

  // Calculate trader stats for expanded view
  const getTraderStats = (wallet: string) => {
    if (!wallet) return null;
    
    const traderTrades = rows.filter(t => t.wallet === wallet);
    const tradeCount = traderTrades.length;
    const totalVolume = traderTrades.reduce((sum, t) => sum + ((t.amountQuote || 0) * (t.price || 0)), 0);
    const buys = traderTrades.filter(t => t.side === 'buy');
    const sells = traderTrades.filter(t => t.side === 'sell');
    
    return {
      tradeCount,
      totalVolume,
      buyCount: buys.length,
      sellCount: sells.length,
      avgTradeSize: tradeCount > 0 ? totalVolume / tradeCount : 0
    };
  };

  const Row = ({ index, style }: { index: number; style: CSSProperties }) => {
    const t = sorted[index];
    const typeClass = t.side === 'buy' ? 'buy' : 'sell';
    const tradeId = `${t.ts}-${t.txHash}`;
    const isExpanded = expandedRow === tradeId;
    
    return (
      <div style={style}>
        <div 
          className={`tr-row ${typeClass}`}
          onMouseEnter={(e) => {
            e.currentTarget.classList.add('hover');
          }}
          onMouseLeave={(e) => {
            e.currentTarget.classList.remove('hover');
          }}
          onClick={() => {
            setExpandedRow(expandedRow === tradeId ? null : tradeId);
          }}
        >
          {columns.map((c) => (
            <div key={c.key} className={`tr-cell${c.className ? ' ' + c.className : ''}`}>
              {c.render(t)}
            </div>
          ))}
        </div>
        
        {isExpanded && (
          <div className="tr-expanded">
            <div className="tr-expanded-content">
              {t.wallet && (
                <>
                  <div className="expanded-section">
                    <h4 className="expanded-section-title">Transaction Details</h4>
                    <div className="expanded-item">
                      <span className="expanded-label">Wallet:</span>
                      <div className="expanded-value">
                        <span>{formatShortAddr(t.wallet)}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard?.writeText(t.wallet!);
                          }}
                          className="copy-btn"
                          title="Copy wallet address"
                        >
                          <ContentCopyIcon sx={{ fontSize: 14 }} />
                        </button>
                        {addressUrl(chain as any, t.wallet) && (
                          <a 
                            href={addressUrl(chain as any, t.wallet)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="external-link"
                            title="View on explorer"
                          >
                            <LaunchIcon sx={{ fontSize: 14 }} />
                          </a>
                        )}
                      </div>
                    </div>
                    {t.txHash && (
                      <div className="expanded-item">
                        <span className="expanded-label">Transaction:</span>
                        <div className="expanded-value">
                          <span>{formatShortAddr(t.txHash)}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard?.writeText(t.txHash!);
                            }}
                            className="copy-btn"
                            title="Copy transaction hash"
                          >
                            <ContentCopyIcon sx={{ fontSize: 14 }} />
                          </button>
                          {txUrl(chain as any, t.txHash) && (
                            <a 
                              href={txUrl(chain as any, t.txHash)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="external-link"
                              title="View transaction on explorer"
                            >
                              <LaunchIcon sx={{ fontSize: 14 }} />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {(() => {
                    const stats = t.wallet ? getTraderStats(t.wallet) : null;
                    return stats && stats.tradeCount > 1 ? (
                      <div className="expanded-section">
                        <h4 className="expanded-section-title">Trader Stats</h4>
                        <div className="expanded-stats">
                          <div className="stat-item">
                            <span className="stat-label">Total Trades:</span>
                            <span className="stat-value">{stats.tradeCount}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Buy/Sell:</span>
                            <span className="stat-value">
                              <span className="buy-count">{stats.buyCount}</span>
                              <span className="stat-separator">/</span>
                              <span className="sell-count">{stats.sellCount}</span>
                            </span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Total Volume:</span>
                            <span className="stat-value">{formatUsd(stats.totalVolume, { compact: true })}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Avg Trade:</span>
                            <span className="stat-value">{formatUsd(stats.avgTradeSize, { compact: true })}</span>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </>
              )}
            </div>
          </div>
        )}
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
    <div className="trades-scroll" ref={containerRef}>
      <div className="trades-table">
        <div className="trades-header">
          {columns.map((c) => (
            <div
              key={c.key}
              className="tr-cell"
              onClick={() => handleSort(c.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {c.header}
              {sortKey === c.key && (
                sortDir === 'asc' ? 
                  <KeyboardArrowUpIcon style={{ fontSize: 16 }} /> : 
                  <KeyboardArrowDownIcon style={{ fontSize: 16 }} />
              )}
            </div>
          ))}
        </div>
        <div className="trades-list-container">
          <List 
            height={containerHeight - 60} // Account for header height
            itemCount={sorted.length} 
            itemSize={(index: number) => {
              const t = sorted[index];
              const tradeId = `${t.ts}-${t.txHash}`;
              if (expandedRow === tradeId) {
                // Base expanded height + additional height for trader stats if available
                const baseHeight = 120;
                const stats = t.wallet ? getTraderStats(t.wallet) : null;
                const statsHeight = stats && stats.tradeCount > 1 ? 80 : 0;
                return ROW_HEIGHT + baseHeight + statsHeight;
              }
              return ROW_HEIGHT;
            }}
            width="100%"
          >
            {Row}
          </List>
        </div>
      </div>
    </div>
  );
}
