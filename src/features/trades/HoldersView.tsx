import { useEffect, useState, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LaunchIcon from '@mui/icons-material/Launch';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { formatShortAddr, formatCompact, formatSmartAmountReact } from '../../lib/format';
import { addressUrl } from '../../lib/explorer';
import CopyButton from '../../components/CopyButton';
import ChartLoader from '../../components/ChartLoader';
import { trades } from '../../lib/api';
import type { Trade } from '../../lib/types';

interface TraderData {
  address: string;
  isContract: boolean;
  balance: number; // Current token balance
  balanceUsd: number; // Current USD value of holdings
  boughtAmount: number; // Total tokens bought
  boughtUsd: number; // Total USD spent buying
  soldAmount: number; // Total tokens sold
  soldUsd: number; // Total USD received selling
  realizedPnlUsd: number; // Realized P&L from completed trades
  unrealizedPnlUsd: number; // Unrealized P&L from current holdings
  totalPnlUsd: number; // Total P&L (realized + unrealized)
  totalVolumeUsd: number; // Total USD volume traded
  transactions: number;
  firstSeen: number;
  lastSeen: number;
  winRate: number;
  trades: Trade[]; // Store trades for dropdown
}

interface Props {
  pairId: string;
  chain: string;
  poolAddress: string;
  tokenAddress: string;
  baseSymbol?: string;
  currentPrice?: number; // Current token price for unrealized PnL calculation
}

type SortKey = 'balance' | 'volume' | 'pnl' | 'transactions' | 'address';

const BASE_ROW_HEIGHT = 64;
const EXPANDED_ROW_HEIGHT = 300;

export default function HoldersView({
  pairId,
  chain,
  poolAddress,
  tokenAddress,
  baseSymbol = 'TOKEN',
  currentPrice = 0,
}: Props) {
  const [traders, setTraders] = useState<TraderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('balance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Function to derive trader data from trades
  const deriveTradersFromTrades = (tradesData: Trade[]): TraderData[] => {
    if (!tradesData || tradesData.length === 0) return [];

    // Get current price from most recent trade if not provided
    const latestPrice = currentPrice || (tradesData.length > 0 ? tradesData[0].price : 0);

    const walletMap = new Map<string, {
      trades: Trade[];
      balance: number;
      boughtAmount: number;
      boughtUsd: number;
      soldAmount: number;
      soldUsd: number;
      transactions: number;
      firstSeen: number;
      lastSeen: number;
      isContract: boolean;
    }>();

    // Aggregate trades by wallet
    tradesData.forEach(trade => {
      if (!trade.wallet) return;

      const wallet = trade.wallet;
      if (!walletMap.has(wallet)) {
        walletMap.set(wallet, {
          trades: [],
          balance: 0,
          boughtAmount: 0,
          boughtUsd: 0,
          soldAmount: 0,
          soldUsd: 0,
          transactions: 0,
          firstSeen: trade.ts,
          lastSeen: trade.ts,
          isContract: wallet.length > 42 || wallet.includes('contract'),
        });
      }

      const walletData = walletMap.get(wallet)!;
      walletData.trades.push(trade);
      walletData.transactions++;
      walletData.firstSeen = Math.min(walletData.firstSeen, trade.ts);
      walletData.lastSeen = Math.max(walletData.lastSeen, trade.ts);

      const tokenAmount = trade.amountBase || 0;
      const tradeUsdValue = trade.amountQuote || (trade.price * tokenAmount);

      if (trade.side === 'buy') {
        walletData.boughtAmount += tokenAmount;
        walletData.boughtUsd += tradeUsdValue;
        walletData.balance += tokenAmount;
      } else {
        walletData.soldAmount += tokenAmount;
        walletData.soldUsd += tradeUsdValue;
        walletData.balance -= tokenAmount;
      }
    });

    // Convert to TraderData array with proper P&L calculations
    return Array.from(walletMap.entries()).map(([wallet, data]) => {
      const balance = data.balance; // Can be negative if net seller
      const balanceUsd = Math.abs(balance) * latestPrice;
      
      // Realized P&L: USD received from sales minus proportional cost basis of sold tokens
      const avgBuyPrice = data.boughtUsd / Math.max(data.boughtAmount, 1);
      const costOfSold = data.soldAmount * avgBuyPrice;
      const realizedPnlUsd = data.soldUsd - costOfSold;
      
      // Unrealized P&L: Current value of holdings minus remaining cost basis
      const costOfHeld = Math.max(0, balance) * avgBuyPrice;
      const unrealizedPnlUsd = Math.max(0, balance) * latestPrice - costOfHeld;
      
      const totalPnlUsd = realizedPnlUsd + unrealizedPnlUsd;
      const totalVolumeUsd = data.boughtUsd + data.soldUsd;
      
      // Win rate: percentage of profitable trades
      const profitableTrades = data.trades.filter(trade => {
        if (trade.side === 'buy') {
          // For buys, check if they bought below average sell price
          const avgSellPrice = data.soldUsd / Math.max(data.soldAmount, 1);
          return trade.price < avgSellPrice;
        } else {
          // For sells, check if they sold above average buy price
          return trade.price > avgBuyPrice;
        }
      }).length;
      const winRate = (profitableTrades / Math.max(data.transactions, 1)) * 100;

      return {
        address: wallet,
        isContract: data.isContract,
        balance: Math.abs(balance),
        balanceUsd,
        boughtAmount: data.boughtAmount,
        boughtUsd: data.boughtUsd,
        soldAmount: data.soldAmount,
        soldUsd: data.soldUsd,
        realizedPnlUsd,
        unrealizedPnlUsd,
        totalPnlUsd,
        totalVolumeUsd,
        transactions: data.transactions,
        firstSeen: data.firstSeen * 1000,
        lastSeen: data.lastSeen * 1000,
        winRate,
        trades: data.trades.sort((a, b) => b.ts - a.ts), // Sort trades by newest first
      };
    }).filter(trader => trader.transactions > 0);
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    trades({ pairId, chain, poolAddress, tokenAddress })
      .then(({ data }) => {
        if (cancelled) return;
        
        const tradersData = deriveTradersFromTrades(data.trades || []);
        setTraders(tradersData);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError('Failed to load trader data');
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pairId, chain, poolAddress, tokenAddress]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

    function formatUsd(
    value?: number,
    opts?: { compact?: boolean; dp?: number }
    ): string {
    if (value === undefined || value === null || !Number.isFinite(value)) return '-';
    const dp = opts?.dp ?? 2;
    if (Math.abs(value) >= 1000 && opts?.compact !== false)
        return `$${formatCompact(value)}`;
    return `$${value.toFixed(dp)}`;
    }

  const sorted = useMemo(() => {
    return [...traders].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortKey) {
        case 'balance':
          aVal = a.balanceUsd;
          bVal = b.balanceUsd;
          break;
        case 'volume':
          aVal = a.totalVolumeUsd;
          bVal = b.totalVolumeUsd;
          break;
        case 'pnl':
          aVal = a.totalPnlUsd;
          bVal = b.totalPnlUsd;
          break;
        case 'transactions':
          aVal = a.transactions;
          bVal = b.transactions;
          break;
        case 'address':
          aVal = a.address;
          bVal = b.address;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string') {
        return sortDir === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [traders, sortKey, sortDir]);

  // Helper function to get row height
  const getRowHeight = (index: number) => {
    const trader = sorted[index];
    return expandedRow === trader?.address ? EXPANDED_ROW_HEIGHT : BASE_ROW_HEIGHT;
  };

  const TraderRow = ({ index, style }: { index: number; style: any }) => {
    const trader = sorted[index];
    if (!trader) return null;

    const traderId = trader.address;
    const isExpanded = expandedRow === traderId;
    const explorerUrl = addressUrl(chain, trader.address as `0x${string}`);
    const pnlColor = trader.totalPnlUsd >= 0 ? 'var(--buy-primary)' : 'var(--sell-primary)';

    return (
      <div style={style} className="trader-row-container">
        {/* Main Row */}
        <div 
          className="trader-row"
          onClick={() => setExpandedRow(isExpanded ? null : traderId)}
        >
          {/* Address */}
          <div className="trader-cell address-cell">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* {trader.isContract ? (
                <BusinessCenterIcon className="trader-type-icon contract" style={{ width: '16px', height: '16px' }} />
              ) : (
                <AccountBalanceWalletIcon className="trader-type-icon wallet" style={{ width: '16px', height: '16px' }} />
              )} */}
                <span className="trader-address">{formatShortAddr(trader.address)}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{trader.transactions} txs</span>
            </div>
            {/* <div className="expand-icon">
              {isExpanded ? <ExpandLessIcon style={{ width: '14px', height: '14px' }} /> : <ExpandMoreIcon style={{ width: '14px', height: '14px' }} />}
            </div> */}
          </div>

          {/* Holdings (Balance & USD Value) */}
          <div className="holdings-cell">
            <div className="cell-main">{formatUsd(trader.balanceUsd)}</div>
            <div className="cell-sub">{formatCompact(trader.balance)} ({((trader.balance / Math.max(traders.reduce((sum, t) => sum + t.balance, 0), 1)) * 100).toFixed(2)}%)</div>
          </div>

          {/* Bought-Sold (2x2 Grid) */}
          <div className="trader-cell bought-sold-cell">
            <div className="bought-sold-grid">
              <div className="grid-section bought">
                <div className="grid-amount">{formatCompact(trader.boughtAmount)}</div>
                <div className="grid-usd">{formatUsd(trader.boughtUsd)}</div>
              </div>
              <div className="grid-section sold">
                <div className="grid-amount">{formatCompact(trader.soldAmount)}</div>
                <div className="grid-usd">{formatUsd(trader.soldUsd)}</div>
              </div>
            </div>
          </div>

          {/* P&L (Realized + Unrealized) */}
          <div className="trader-cell pnl-cell">
            <div className="cell-main" style={{ color: pnlColor }}>
                {/* if the value that "formatUsd(trader.totalPnlUsd)" returns is negative like "-12.3" the function returns it like "$-12.3" so we need to turn it into "-$12.3" */}
                {trader.totalPnlUsd < 0 ? `-${formatUsd(Math.abs(trader.totalPnlUsd))}` : `+${formatUsd(trader.totalPnlUsd)}`}
            </div>
            <div className="cell-sub">{trader.winRate.toFixed(1)}% wr</div>
          </div>
        </div>

        {/* Expanded Trades Table */}
        {isExpanded && (
          <div className="trader-expanded">
            <div className="expanded-header">
              <span>Recent Trades ({trader.trades.length})</span>
              <div className="trader-summary">
                <span>Realized: <span style={{ color: trader.realizedPnlUsd >= 0 ? 'var(--buy-primary)' : 'var(--sell-primary)' }}>
                  {formatUsd(trader.realizedPnlUsd)}
                </span></span>
                <span>Unrealized: <span style={{ color: trader.unrealizedPnlUsd >= 0 ? 'var(--buy-primary)' : 'var(--sell-primary)' }}>
                  {formatUsd(trader.unrealizedPnlUsd)}
                </span></span>
              </div>
            </div>
            
            <div className="trades-mini-table">
              <div className="mini-table-header">
                <div>Time</div>
                <div>Side</div>
                <div>Amount</div>
                <div>Price</div>
                <div>Total</div>
              </div>
              
              <div className="mini-table-body">
                {trader.trades.slice(0, 10).map((trade, idx) => (
                  <div key={idx} className="mini-trade-row">
                    <div className="mini-cell time-cell">
                      <time dateTime={new Date(trade.ts * 1000).toISOString()}>
                        {new Date(trade.ts * 1000).toLocaleString()}
                      </time>
                    </div>
                    <div className={`mini-cell side-cell ${trade.side}`}>
                      {trade.side === 'buy' ? (
                        <TrendingUpIcon className="side-icon buy" />
                      ) : (
                        <TrendingDownIcon className="side-icon sell" />
                      )}
                    </div>
                    <div className="mini-cell amount-cell" style={{ alignItems: 'flex-end' }}>
                      {formatSmartAmountReact(trade.amountBase || 0)} {baseSymbol}
                    </div>
                    <div className="mini-cell price-cell">
                      ${formatSmartAmountReact(trade.price)}
                    </div>
                    <div className="mini-cell total-cell">
                      ${formatSmartAmountReact(trade.amountQuote || (trade.price * (trade.amountBase || 0)))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="trades-view">
        <div className="trades-loader">
          <ChartLoader />
          <div>Loading top traders...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trades-view">
        <div className="trades-error">{error}</div>
      </div>
    );
  }

  if (traders.length === 0) {
    return (
      <div className="trades-view">
        <div className="trades-no-data">No trader data available</div>
      </div>
    );
  }

  return (
    <div className="traders-view">
      {/* Table Header */}
      <div className="traders-table-header">
        <div 
          className={`header-cell address-header ${sortKey === 'address' ? 'sorted' : ''}`}
          onClick={() => handleSort('address')}
        >
          <span>Maker</span>
          {sortKey === 'address' && (
            sortDir === 'asc' ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />
          )}
        </div>
        
        <div 
          className={`header-cell holdings-header ${sortKey === 'balance' ? 'sorted' : ''}`}
          onClick={() => handleSort('balance')}
        >
          <span>Holdings</span>
          {sortKey === 'balance' && (
            sortDir === 'asc' ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />
          )}
        </div>
        
        <div 
          className={`header-cell volume-header ${sortKey === 'volume' ? 'sorted' : ''}`}
          onClick={() => handleSort('volume')}
        >
          <span>Tradings</span>
          {sortKey === 'volume' && (
            sortDir === 'asc' ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />
          )}
        </div>
        
        <div 
          className={`header-cell pnl-header ${sortKey === 'pnl' ? 'sorted' : ''}`}
          onClick={() => handleSort('pnl')}
        >
          <span>PnL</span>
          {sortKey === 'pnl' && (
            sortDir === 'asc' ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />
          )}
        </div>
      </div>

      {/* Virtual List */}
      <div className="traders-table-body">
        <List
          height={400}
          width="100%"
          itemCount={sorted.length}
          itemSize={getRowHeight}
          overscanCount={5}
        >
          {TraderRow}
        </List>
      </div>
    </div>
  );
}
