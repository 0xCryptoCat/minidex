import { useEffect, useState, useMemo, ReactNode, CSSProperties, useRef } from 'react';
import { VariableSizeList as List } from 'react-window';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HistoryIcon from '@mui/icons-material/History';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FunctionsIcon from '@mui/icons-material/Functions';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
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
import ChartLoader from '../../components/ChartLoader';
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
  | 'tokens'
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
  const [priceColumnMode, setPriceColumnMode] = useState<'price' | 'total'>('total'); // Default to total
  const [containerHeight, setContainerHeight] = useState(400);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const DEBUG = (import.meta as any).env?.DEBUG === 'true';
  const sampleTradesLoggedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    
    // Debug for Telegram webapp
    if ((window as any).Telegram?.WebApp) {
      console.log('Fetching trades for Telegram:', { pairId, chain, poolAddress, tokenAddress });
    }
    
    trades({ pairId, chain, poolAddress, tokenAddress })
      .then(({ data, meta }) => {
        if (cancelled) return;
        
        if ((window as any).Telegram?.WebApp) {
          console.log('Trades response:', { 
            tradesLength: data.trades?.length,
            hasData: !!data.trades,
            isArray: Array.isArray(data.trades),
            metaProvider: meta?.provider
          });
        }
        
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
      .catch((error) => {
        if (!cancelled) {
          if ((window as any).Telegram?.WebApp) {
            console.error('Trades fetch error:', error);
          }
          setNoTrades(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pairId, chain, poolAddress, tokenAddress]);

  // Measure container height with better fallbacks
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 600;
        const availableHeight = viewportHeight - rect.top - 100; // Leave margin for bottom tabs
        const calculatedHeight = Math.max(400, availableHeight);
        setContainerHeight(calculatedHeight);
        
        // Debug logging for Telegram webapp
        if ((window as any).Telegram?.WebApp) {
          console.log('Trades height calc:', {
            viewportHeight,
            rectTop: rect.top,
            availableHeight,
            calculatedHeight,
            containerRefExists: !!containerRef.current
          });
        }
      } else {
        // Fallback if no container ref
        setContainerHeight(500);
      }
    };

    // Multiple attempts to get height, important for Telegram
    updateHeight();
    const timer1 = setTimeout(updateHeight, 100);
    const timer2 = setTimeout(updateHeight, 500);
    
    window.addEventListener('resize', updateHeight);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Helper function to count transactions per trader
  const getTraderTxCount = (wallet: string): number => {
    if (!wallet) return 0;
    return rows.filter(t => t.wallet === wallet).length;
  };

  // Helper function to format numbers with max 3 decimals
  const formatTradeAmount = (value?: number): ReactNode => {
    if (value === undefined || value === null || !Number.isFinite(value)) return '-';
    if (value === 0) return '0';

    const abs = Math.abs(value);

    // For numbers >= 1000, use compact notation
    if (abs >= 1000) {
      if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
      if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
      if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    }

    // For other numbers, limit to 3 decimals max
    if (abs >= 1) return value.toFixed(Math.min(3, 2));
    if (abs >= 0.001) return value.toFixed(3);
    
    // For very small numbers, use the original formatting
    return formatSmartAmountReact(value);
  };

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
        header: 'Price/Total',
        accessor: (t) => priceColumnMode === 'total' ? (t.amountBase || 0) * (t.price || 0) : t.price,
        render: (t) => {
          const total = (t.amountBase || 0) * (t.price || 0);
          const sideColor = t.side === 'buy' ? 'var(--buy-primary)' : 'var(--sell-primary)';
          return (
            <div className="price-total-cell">
              <div className="price-total-row" style={{ color: sideColor, fontWeight: 600 }}>
                ∑$<span>{formatTradeAmount(total)}</span>
              </div>
              <div className="price-total-row" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                ~$<span>{formatTradeAmount(t.price)}</span>
              </div>
            </div>
          );
        },
        comparator: (a: number | undefined, b: number | undefined) =>
          (a || 0) - (b || 0),
      },
      {
        key: 'tokens',
        header: 'Tokens',
        accessor: (t) => t.amountQuote || 0, // Sort by quote value instead of base
        render: (t) => {
          const sideColor = t.side === 'buy' ? 'var(--buy-primary)' : 'var(--sell-primary)';
          return (
            <div className="tokens-cell">
              <div className="tokens-row">
                <div className="tokens-amount" style={{ color: sideColor, fontWeight: 600 }}>
                  {formatTradeAmount(t.amountBase)}
                </div>
                <div className="tokens-symbol" style={{ color: sideColor, fontWeight: 600 }}>
                  {baseSymbol || 'BASE'}
                </div>
              </div>
              <div className="tokens-row">
                <div className="tokens-amount" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  {formatTradeAmount(t.amountQuote)}
                </div>
                <div className="tokens-symbol" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  {quoteSymbol || 'QUOTE'}
                </div>
              </div>
            </div>
          );
        },
        comparator: (a: number, b: number) => a - b,
      },
      {
        key: 'wallet',
        header: 'Maker',
        accessor: (t) => t.wallet || '',
        render: (t) => {
          const traderTxCount = getTraderTxCount(t.wallet || '');
          return (
            <div className="maker-cell">
              <div className="maker-addr" style={{ whiteSpace: 'nowrap' }}>
                {formatShortAddr(t.wallet)}
              </div>
              <div className="maker-txs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                {traderTxCount} Txs
              </div>
            </div>
          );
        },
        comparator: (a: string, b: string) => a.localeCompare(b),
        className: 'maker-column',
      },
    ],
    [baseSymbol, quoteSymbol, priceColumnMode, rows]
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
          style={isExpanded ? {
            backgroundColor: t.side === 'buy' 
              ? 'rgba(52, 199, 89, 0.1)' 
              : 'rgba(225, 50, 50, 0.1)',
            borderLeft: `3px solid ${t.side === 'buy' ? 'var(--buy-primary)' : 'var(--sell-primary)'}`,
          } : undefined}
        >
          {columns.map((c) => (
            <div 
              key={c.key} 
              className={`tr-cell${c.className ? ' ' + c.className : ''}`}
              style={{
                // Force cell visibility
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold',
              }}
            >
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
                    <h4 className="expanded-section-title">TXn Details</h4>
                    <div className="expanded-details">
                      <div className="expanded-item">
                        <span className="stat-label">Wallet:</span>
                        <div className="stat-value">
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
                          <span className="stat-label">Tx Hash:</span>
                          <div className="stat-value">
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
        {(window as any).Telegram?.WebApp && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Telegram WebApp detected - using fallback rendering
          </div>
        )}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="trades-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-6)' }}>
        <ChartLoader message="Loading trades..." />
        {(window as any).Telegram?.WebApp && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Telegram WebApp - this may take a moment
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="trades-scroll" 
      ref={containerRef}
      style={{
        // Force visibility
        minHeight: '500px',
        backgroundColor: 'var(--bg)' ,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div 
        className="trades-table"
        style={{
          // Force table visibility
          backgroundColor: 'var(--bg)',
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div 
          className="trades-header"
          style={{
            // Force header visibility
            border: '3px solid var(--bg-elev)',
            color: 'var(--text)',
            padding: '8px 10px',
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'grid',
            gridTemplateColumns: '0.5fr 1.25fr 2.5fr 1fr',
            gap: '8px',
            height: '40px',
          }}
        >
          {/* Time Column */}
          <div
            className="tr-cell"
            onClick={() => handleSort('time')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            <HistoryIcon style={{ fontSize: 16, color: 'var(--text)' }} />
            {sortKey === 'time' && (
              sortDir === 'asc' ? 
                <KeyboardArrowUpIcon style={{ fontSize: 14 }} /> : 
                <KeyboardArrowDownIcon style={{ fontSize: 14 }} />
            )}
          </div>

          {/* Price/Total Column with dual sorting */}
          <div
            className="tr-cell"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            <div
              onClick={() => {
                setPriceColumnMode('total');
                handleSort('price');
              }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                opacity: priceColumnMode === 'total' ? 1 : 0.6,
              }}
            >
              <FunctionsIcon style={{ fontSize: 16, color: 'var(--text)' }} />
              {sortKey === 'price' && priceColumnMode === 'total' && (
                sortDir === 'asc' ? 
                  <KeyboardArrowUpIcon style={{ fontSize: 14 }} /> : 
                  <KeyboardArrowDownIcon style={{ fontSize: 14 }} />
              )}
            </div>
            <div style={{ width: '4px' }} />
            <div
              onClick={() => {
                setPriceColumnMode('price');
                handleSort('price');
              }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                opacity: priceColumnMode === 'price' ? 1 : 0.6,
              }}
            >
              <AttachMoneyIcon style={{ fontSize: 16, color: 'var(--text)' }} />
              {sortKey === 'price' && priceColumnMode === 'price' && (
                sortDir === 'asc' ? 
                  <KeyboardArrowUpIcon style={{ fontSize: 14 }} /> : 
                  <KeyboardArrowDownIcon style={{ fontSize: 14 }} />
              )}
            </div>
          </div>

          {/* Tokens Column */}
          <div
            className="tr-cell"
            onClick={() => handleSort('tokens')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            <CurrencyExchangeIcon style={{ fontSize: 16, color: 'var(--text)' }} />
            {sortKey === 'tokens' && (
              sortDir === 'asc' ? 
                <KeyboardArrowUpIcon style={{ fontSize: 14 }} /> : 
                <KeyboardArrowDownIcon style={{ fontSize: 14 }} />
            )}
          </div>

          {/* Maker Column */}
          <div
            className="tr-cell"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 'bold',
              cursor: 'default', // No pointer cursor since it's not clickable
            }}
          >
            <AccountBalanceWalletIcon style={{ fontSize: 16, color: 'var(--text)' }} />
            {/* No sorting arrows for maker column */}
          </div>
        </div>
        <div className="trades-list-container" style={{ backgroundColor: 'var(--bg-elev)' }}>
          {/* Enhanced Telegram webapp compatibility - always use fallback in Telegram */}
          {(window as any).Telegram?.WebApp ? (
            <div 
              className="trades-list-fallback"
              style={{ 
                height: Math.max(400, containerHeight - 60),
                overflow: 'auto',
                maxHeight: 'calc(100vh - 200px)', // Better viewport handling
                WebkitOverflowScrolling: 'touch', // iOS smooth scrolling
              }}
            >
              {(window as any).Telegram?.WebApp && (
                <div style={{ 
                  padding: 'var(--space-2)', 
                  background: 'var(--bg-elev-2)', 
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-small)',
                  margin: 'var(--space-2) 0'
                }}>
                  🔄 Telegram webapp detected - using optimized rendering
                </div>
              )}
              {sorted.map((trade, index) => {
                const tradeId = `${trade.ts}-${trade.txHash}`;
                const isExpanded = expandedRow === tradeId;
                const baseHeight = ROW_HEIGHT;
                const stats = trade.wallet ? getTraderStats(trade.wallet) : null;
                const expandedHeight = isExpanded ? (100 + (stats && stats.tradeCount > 1 ? 80 : 0)) : 0;
                
                return (
                  <div
                    key={tradeId}
                    style={{ 
                      height: baseHeight + expandedHeight,
                      width: '100%',
                      flexShrink: 0,
                    }}
                  >
                    {Row({ index, style: { height: baseHeight + expandedHeight, width: '100%' } })}
                  </div>
                );
              })}
            </div>
          ) : (
            <List
              height={Math.max(300, containerHeight - 60)}
              itemCount={sorted.length}
              itemSize={(index: number) => {
                const t = sorted[index];
                const tradeId = `${t.ts}-${t.txHash}`;
                if (expandedRow === tradeId) {
                  const baseHeight = 100;
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
          )}
        </div>
      </div>
    </div>
  );
}
