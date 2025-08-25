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
import AddBoxIcon from '@mui/icons-material/AddBox';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
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
import CopyButton from '../../components/CopyButton';
import TripleToggle from '../../components/TripleToggle';
import HoldersView from './HoldersView';
import MetricsView from './MetricsView';
import '../../styles/trades.css';
import '../../styles/trades-views.css';

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

type ViewMode = 'trades' | 'holders' | 'metrics';

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
  const [viewMode, setViewMode] = useState<ViewMode>('trades');
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
              volumeUSD: t.volumeUSD,
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

  // Helper function to analyze trader data
  const getTraderAnalysis = (wallet: string) => {
    if (!wallet) return null;
    
    const traderTrades = rows.filter(t => t.wallet === wallet);
    const buys = traderTrades.filter(t => t.side === 'buy');
    const sells = traderTrades.filter(t => t.side === 'sell');
    
    // Use only volumeUSD (volume_in_usd from API) - no fallbacks
    const buyUsdTotal = buys.reduce((sum, t) => sum + (t.volumeUSD || 0), 0);
    const sellUsdTotal = sells.reduce((sum, t) => sum + (t.volumeUSD || 0), 0);
    
    const buyBaseTotal = buys.reduce((sum, t) => sum + (t.amountBase || 0), 0);
    const sellBaseTotal = sells.reduce((sum, t) => sum + (t.amountBase || 0), 0);
    const stillHeldBase = Math.max(0, buyBaseTotal - sellBaseTotal); // Only positive holdings
    
    // Get current price for unrealized PnL calculation
    const lastTrade = rows[rows.length - 1];
    const currentPrice = lastTrade?.price || 0;
    const unrealizedUsd = stillHeldBase > 0 ? stillHeldBase * currentPrice : 0;
    
    // PnL calculation: Current holding value - Buy cost + Sell proceeds
    const pnlUsd = unrealizedUsd - buyUsdTotal + sellUsdTotal;
    const volumeUsd = buyUsdTotal + sellUsdTotal;
    
    return {
      buyCount: buys.length,
      sellCount: sells.length,
      totalTrades: traderTrades.length,
      buyUsdTotal,
      sellUsdTotal,
      pnlUsd,
      volumeUsd,
      buyBaseTotal,
      sellBaseTotal,
      stillHeldBase,
      unrealizedUsd, // Unrealized P&L is the USD value of current holdings
      currentPrice
    };
  };

  // Helper function to get account size indicator
  const getAccountSizeIndicator = (volumeUsd: number) => {
    if (volumeUsd >= 50000) {
      return { 
        icon: 'https://img.icons8.com/ios-glyphs/30/squid.png',
        fallback: '🦑',
        name: 'Kraken'
      };
    } else if (volumeUsd >= 10000) {
      return { 
        icon: 'https://img.icons8.com/ios-glyphs/30/whale.png',
        fallback: '🐋',
        name: 'Whale'
      };
    } else if (volumeUsd >= 1000) {
      return { 
        icon: 'https://img.icons8.com/ios-glyphs/30/dolphin.png',
        fallback: '🐬',
        name: 'Dolphin'
      };
    } else if (volumeUsd >= 250) {
      return { 
        icon: 'https://img.icons8.com/ios-glyphs/30/fish.png',
        fallback: '🐠',
        name: 'Fish'
      };
    } else {
      return { 
        icon: 'https://img.icons8.com/ios-glyphs/30/prawn.png',
        fallback: '🦐',
        name: 'Shrimp'
      };
    }
  };

  const columns: ColumnConfig[] = useMemo(
    () => [
      /* Time Column */
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
      /* Price Column */
      {
        key: 'price',
        header: 'Price/Total',
        accessor: (t) => priceColumnMode === 'total' ? (t.volumeUSD || 0) : t.price,
        render: (t) => {
          const total = t.volumeUSD || 0; // Use only volumeUSD (volume_in_usd from API), no fallbacks
          const sideColor = t.side === 'buy' ? 'var(--buy-primary)' : 'var(--sell-primary)';
          return (
            <div className="price-total-cell">
              <div className="price-total-row" style={{ color: sideColor, fontWeight: 600 }}>
                <FunctionsIcon sx={{ fontSize: '12px', color: sideColor }} />$<span>{formatTradeAmount(total)}</span>
              </div>
              <div className="price-total-row" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                $<span>{formatTradeAmount(t.price)}</span>
              </div>
            </div>
          );
        },
        comparator: (a: number | undefined, b: number | undefined) =>
          (a || 0) - (b || 0),
      },
      /* Tokens Column */
      {
        key: 'tokens',
        header: 'Tokens',
        accessor: (t) => t.amountQuote || 0, // Sort by quote value instead of base
        render: (t) => {
          const sideColor = t.side === 'buy' ? 'var(--buy-primary)' : 'var(--sell-primary)';
          return (
            <div className="tokens-cell" style={{ display: 'flow', alignItems: 'space-around' }}>
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
      /* Maker Column */
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
              <div className="maker-txs" style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 400 }}>
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
    // Use only volumeUSD (volume_in_usd from API) - no fallbacks
    const totalVolume = traderTrades.reduce((sum, t) => sum + (t.volumeUSD || 0), 0);
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
                display: 'flow',
                alignItems: 'center',
                fontWeight: 'bold',
              }}
            >
              {c.render(t)}
            </div>
          ))}
        </div>
        
        {isExpanded && (
          <div className="tr-expanded" style={{ background: t.side === 'buy' ? 'rgb(32 45 36)' : 'rgb(49 31 33)', borderLeft: t.side === 'buy' ? '3px solid var(--buy-primary)' : '3px solid var(--sell-primary)', borderBottom: t.side === 'buy' ? '3px solid var(--buy-primary)' : '3px solid var(--sell-primary)' }}>
            <div className="tr-expanded-content">
              {t.wallet && (() => {
                const analysis = getTraderAnalysis(t.wallet);
                if (!analysis) return null;
                
                const accountSize = getAccountSizeIndicator(analysis.volumeUsd);
                
                return (
                  <>
                    {/* Section Top: Account Size + TXn Hash + Maker Address */}
                    <div className="expanded-section-top" style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 2fr 2fr',
                      gap: '12px',
                      marginBottom: '10px',
                      padding: '12px',
                      background: 'var(--bg-elev)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                    }}>
                      {/* Account Size Indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
                        <img 
                          src={accountSize.icon} 
                          alt={accountSize.name}
                          style={{ width: '24px', height: '24px', filter: 'invert(1)' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling!.textContent = accountSize.fallback;
                          }}
                        />
                      </div>
                      
                      {/* TXn Hash */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            TX HASH
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text)', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
                            {t.txHash ? formatShortAddr(t.txHash) : 'Unknown'}
                            {t.txHash && (
                          <>
                            <CopyButton text={t.txHash} />
                            {txUrl(chain as any, t.txHash) && (
                              <a 
                                href={txUrl(chain as any, t.txHash)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{ color: 'var(--text)', textDecoration: 'none', fontSize: 14, paddingTop: '5px' }}
                              >
                                <LaunchIcon sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                              </a>
                            )}
                          </>
                        )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Maker Address */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            MAKER
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text)', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
                            {formatShortAddr(t.wallet)}
                            <CopyButton text={t.wallet} />
                            {addressUrl(chain as any, t.wallet) && (
                              <a 
                                href={addressUrl(chain as any, t.wallet)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{ color: 'var(--text)', textDecoration: 'none', fontSize: 14, paddingTop: '5px' }}
                              >
                                <LaunchIcon sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Middle: Buys/Sells/PnL Analysis */}
                    <div className="expanded-section-middle" style={{
                      display: 'grid',
                      alignItems: 'center',
                      gridTemplateColumns: 'auto 1fr 1fr 1fr',
                      gap: '8px',
                      marginBottom: '10px',
                      padding: '12px',
                      background: 'var(--bg-elev)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                    }}>
                      {/* Buys Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--buy-primary)' }}>
                        <AddBoxIcon sx={{ fontSize: 16, fontWeight: 600 }} />
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--buy-primary)', textAlign: 'right' }}>
                        ${formatTradeAmount(analysis.buyUsdTotal)}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>
                        {formatTradeAmount(analysis.buyBaseTotal)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                        {analysis.buyCount} Txs
                      </div>

                      {/* Sells Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--sell-primary)' }}>
                        <IndeterminateCheckBoxIcon sx={{ fontSize: 16, fontWeight: 600 }} />
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sell-primary)', textAlign: 'right' }}>
                        ${formatTradeAmount(analysis.sellUsdTotal)}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>
                        {formatTradeAmount(analysis.sellBaseTotal)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                        {analysis.sellCount} Txs
                      </div>

                      {/* PnL Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
                        <AnalyticsIcon sx={{ fontSize: 16, fontWeight: 600 }} />
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: analysis.pnlUsd >= 0 ? 'var(--buy-primary)' : 'var(--sell-primary)', 
                        textAlign: 'right',
                        fontWeight: 600 
                      }}>
                        {analysis.pnlUsd >= 0 ? '+' : '-'}${formatTradeAmount(Math.abs(analysis.pnlUsd))}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--text)', 
                        textAlign: 'right' 
                      }}>
                        {formatTradeAmount(Math.abs(analysis.stillHeldBase))}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                        {analysis.totalTrades} Txs
                      </div>
                    </div>

                    {/* Section Bottom: Unrealized Holdings */}
                    <div className="expanded-section-bottom" style={{
                      display: 'grid',
                      alignItems: 'center',
                      gridTemplateColumns: '0.5fr 0.5fr 2fr',
                      gap: '12px',
                      padding: '10px',
                      background: 'var(--bg-elev)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                    }}>
                      {/* Unrealized Icon */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BusinessCenterIcon sx={{ fontSize: 16, color: 'var(--text)' }} />
                      </div>
                      
                      {/* Unrealized USD Value */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '12px',
                          color: analysis.unrealizedUsd < analysis.buyUsdTotal && analysis.sellUsdTotal < 0 ? 'var(--warning)' : (analysis.stillHeldBase >= 0 ? 'var(--buy-primary)' : 'var(--sell-primary)'), 
                          fontWeight: 600 
                          }}>
                          {analysis.stillHeldBase > 0 ? `$${formatTradeAmount(analysis.unrealizedUsd)}` : 'Unknown'}
                        </div>
                      </div>
                      
                      {/* Holdings Progress Bar */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                          <span style={{ color: 'var(--text)', textAlign: 'left' }}>
                            {analysis.stillHeldBase > 0 ? formatTradeAmount(analysis.stillHeldBase) : '0'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>
                            {formatTradeAmount(analysis.buyBaseTotal)}
                          </span>
                        </div>
                        <div style={{ 
                          width: '100%', 
                          height: '4px', 
                          background: 'var(--text-muted)', 
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: analysis.buyBaseTotal > 0 ? `${Math.min(100, (analysis.stillHeldBase / analysis.buyBaseTotal) * 100)}%` : '0%',
                            height: '100%',
                            background: analysis.stillHeldBase > 0 ? 'var(--text)' : 'var(--text-muted)',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
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
        {/* {(window as any).Telegram?.WebApp && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Telegram WebApp detected - using fallback rendering
          </div>
        )} */}
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
    <div className="trades-only-view">
      {/* Triple Toggle */}
      <TripleToggle
        selected={viewMode}
        onChange={setViewMode}
        className="trades-toggle"
      />

      {/* Conditional Rendering Based on View Mode */}
      {viewMode === 'trades' && (
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
                  justifyContent: 'space-around',
                  alignItems: 'center', 
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
                    opacity: priceColumnMode === 'total' ? 1 : 0.5,
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
                  justifyContent: 'center', 
                  alignItems: 'center', 
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

            {/* Trades List Container */}
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
                  {/* {(window as any).Telegram?.WebApp && (
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
                  )} */}
                  {sorted.map((trade, index) => {
                    const tradeId = `${trade.ts}-${trade.txHash}`;
                    const isExpanded = expandedRow === tradeId;
                    const baseHeight = ROW_HEIGHT;
                    const stats = trade.wallet ? getTraderStats(trade.wallet) : null;
                    const expandedHeight = isExpanded ? 220 : 0; // Fixed height for the new 3-section layout
                    
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
      )}

      {/* Holders View */}
      {viewMode === 'holders' && (
        <HoldersView
          pairId={pairId}
          chain={chain}
          poolAddress={poolAddress}
          tokenAddress={tokenAddress}
          baseSymbol={baseSymbol}
        />
      )}

      {/* Metrics View */}
      {viewMode === 'metrics' && (
        <MetricsView
          pairId={pairId}
          chain={chain}
          poolAddress={poolAddress}
          tokenAddress={tokenAddress}
        />
      )}
    </div>
  );
}
