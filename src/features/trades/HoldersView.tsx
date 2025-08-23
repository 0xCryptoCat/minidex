import { useEffect, useState, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LaunchIcon from '@mui/icons-material/Launch';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { formatUsd, formatShortAddr, formatCompact } from '../../lib/format';
import { addressUrl } from '../../lib/explorer';
import CopyButton from '../../components/CopyButton';
import ChartLoader from '../../components/ChartLoader';
import { trades } from '../../lib/api';
import type { Trade } from '../../lib/types';

interface HolderData {
  address: string;
  isContract: boolean;
  balance: number;
  balanceUsd: number;
  volume: number;
  volumeUsd: number;
  pnl: number;
  pnlUsd: number;
  transactions: number;
  firstSeen: number;
  lastSeen: number;
  avgTradeSize: number;
  largestTrade: number;
  winRate: number;
}

interface Props {
  pairId: string;
  chain: string;
  poolAddress: string;
  tokenAddress: string;
  baseSymbol?: string;
}

type SortKey = 'balance' | 'volume' | 'pnl' | 'transactions' | 'address';

const ROW_HEIGHT = 52;

export default function HoldersView({
  pairId,
  chain,
  poolAddress,
  tokenAddress,
  baseSymbol = 'TOKEN',
}: Props) {
  const [holders, setHolders] = useState<HolderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('balance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    trades({ pairId, chain, poolAddress, tokenAddress })
      .then(({ data }) => {
        if (cancelled) return;
        
        const holdersData = deriveHoldersFromTrades(data.trades || []);
        setHolders(holdersData);
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

  // Function to derive holder data from trades
  const deriveHoldersFromTrades = (tradesData: Trade[]): HolderData[] => {
    if (!tradesData || tradesData.length === 0) return [];

    const walletMap = new Map<string, {
      trades: Trade[];
      balance: number;
      totalBought: number;
      totalSold: number;
      totalVolume: number;
      totalVolumeUsd: number;
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
          totalBought: 0,
          totalSold: 0,
          totalVolume: 0,
          totalVolumeUsd: 0,
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
      const usdAmount = trade.amountQuote || (trade.price * tokenAmount);

      if (trade.side === 'buy') {
        walletData.totalBought += tokenAmount;
        walletData.balance += tokenAmount;
      } else {
        walletData.totalSold += tokenAmount;
        walletData.balance -= tokenAmount;
      }

      walletData.totalVolume += tokenAmount;
      walletData.totalVolumeUsd += usdAmount;
    });

    // Convert to HolderData array
    return Array.from(walletMap.entries()).map(([wallet, data]) => {
      const averagePrice = data.totalVolumeUsd / data.totalVolume || 0;
      const balanceUsd = Math.abs(data.balance) * averagePrice;
      const pnl = data.balance > 0 ? data.balance * averagePrice - (data.totalBought * averagePrice) : 0;
      const avgTradeSize = data.totalVolume / data.transactions;
      const largestTrade = Math.max(...data.trades.map(t => t.amountBase || 0));
      const winningTrades = data.trades.filter(t => {
        // Simple win rate calculation based on if they bought low and sold high
        const avgPrice = data.totalVolumeUsd / data.totalVolume;
        return t.side === 'buy' ? t.price < avgPrice : t.price > avgPrice;
      }).length;
      const winRate = (winningTrades / data.transactions) * 100;

      return {
        address: wallet,
        isContract: data.isContract,
        balance: Math.abs(data.balance),
        balanceUsd,
        volume: data.totalVolume,
        volumeUsd: data.totalVolumeUsd,
        pnl: data.balance,
        pnlUsd: pnl,
        transactions: data.transactions,
        firstSeen: data.firstSeen * 1000,
        lastSeen: data.lastSeen * 1000,
        avgTradeSize,
        largestTrade,
        winRate,
      };
    }).filter(holder => holder.transactions > 0);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    return [...holders].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortKey) {
        case 'balance':
          aVal = a.balanceUsd;
          bVal = b.balanceUsd;
          break;
        case 'volume':
          aVal = a.volumeUsd;
          bVal = b.volumeUsd;
          break;
        case 'pnl':
          aVal = a.pnlUsd;
          bVal = b.pnlUsd;
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
  }, [holders, sortKey, sortDir]);

  const Row = ({ index, style }: { index: number; style: any }) => {
    const holder = sorted[index];
    if (!holder) return null;

    const holderId = holder.address;
    const isExpanded = expandedRow === holderId;
    const explorerUrl = addressUrl(chain, holder.address as `0x${string}`);
    const pnlColor = holder.pnlUsd >= 0 ? 'var(--buy-primary)' : 'var(--sell-primary)';
    const timeAgo = Math.floor((Date.now() - holder.lastSeen) / (1000 * 60 * 60));

    return (
      <div style={style} className="holder-row-container">
        {/* Main Row */}
        <div 
          className="holder-row"
          onClick={() => setExpandedRow(isExpanded ? null : holderId)}
          style={{ cursor: 'pointer' }}
        >
          {/* Type & Address */}
          <div className="holder-cell address-cell">
            {holder.isContract ? (
              <BusinessCenterIcon className="holder-type-icon contract" />
            ) : (
              <AccountBalanceWalletIcon className="holder-type-icon wallet" />
            )}
            <span className="holder-address">{formatShortAddr(holder.address)}</span>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </div>

          {/* Holdings */}
          <div className="holder-cell holdings-cell">
            <span className="cell-value">{formatUsd(holder.balanceUsd)}</span>
            <span className="cell-secondary">{formatCompact(holder.balance)} {baseSymbol}</span>
          </div>

          {/* Volume */}
          <div className="holder-cell volume-cell">
            <span className="cell-value">{formatUsd(holder.volumeUsd)}</span>
            <span className="cell-secondary">{holder.transactions} txs</span>
          </div>

          {/* P&L */}
          <div className="holder-cell pnl-cell">
            <span className="cell-value" style={{ color: pnlColor }}>
              {holder.pnlUsd >= 0 ? '+' : ''}{formatUsd(holder.pnlUsd)}
            </span>
            <span className="cell-secondary">{holder.winRate.toFixed(1)}% win</span>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="holder-expanded">
            <div className="expanded-grid">
              <div className="expanded-section">
                <div className="section-title">Wallet Info</div>
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{holder.isContract ? 'Contract' : 'Wallet'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <div className="detail-address">
                    <span className="detail-value">{holder.address}</span>
                    <CopyButton text={holder.address} />
                    {explorerUrl && (
                      <a href={explorerUrl} target="_blank" rel="noreferrer" className="explorer-link">
                        <LaunchIcon fontSize="small" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="detail-row">
                  <span className="detail-label">First seen:</span>
                  <span className="detail-value">{Math.floor((Date.now() - holder.firstSeen) / (1000 * 60 * 60 * 24))} days ago</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Last trade:</span>
                  <span className="detail-value">{timeAgo < 24 ? `${timeAgo}h ago` : `${Math.floor(timeAgo/24)}d ago`}</span>
                </div>
              </div>

              <div className="expanded-section">
                <div className="section-title">Trading Stats</div>
                <div className="detail-row">
                  <span className="detail-label">Avg trade size:</span>
                  <span className="detail-value">{formatUsd(holder.avgTradeSize)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Largest trade:</span>
                  <span className="detail-value">{formatUsd(holder.largestTrade)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Win rate:</span>
                  <span className="detail-value" style={{ color: holder.winRate > 50 ? 'var(--buy-primary)' : 'var(--sell-primary)' }}>
                    {holder.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total P&L:</span>
                  <span className="detail-value" style={{ color: pnlColor }}>
                    {holder.pnlUsd >= 0 ? '+' : ''}{formatUsd(holder.pnlUsd)} ({holder.pnlUsd >= 0 ? '+' : ''}{formatCompact(holder.pnl)} {baseSymbol})
                  </span>
                </div>
              </div>

              <div className="expanded-section">
                <div className="section-title">Portfolio Share</div>
                <div className="portfolio-bar">
                  <div 
                    className="portfolio-fill"
                    style={{ 
                      width: `${Math.min(100, (holder.balanceUsd / Math.max(...holders.map(h => h.balanceUsd))) * 100)}%`,
                      background: 'var(--brand-primary)'
                    }}
                  />
                </div>
                <div className="portfolio-percent">
                  {((holder.balanceUsd / holders.reduce((sum, h) => sum + h.balanceUsd, 0)) * 100).toFixed(2)}% of tracked holdings
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <ChartLoader message="Loading holders data..." />;
  }

  if (error) {
    return (
      <div className="holders-error">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (holders.length === 0) {
    return (
      <div className="holders-empty">
        <div className="empty-message">No holders data available</div>
      </div>
    );
  }

  return (
    <div className="holders-view">
      {/* Header */}
      <div className="holders-header">
        <div className="holders-count">Top Holders ({holders.length})</div>
      </div>

      {/* Table Header */}
      <div className="holders-table-header">
        <div 
          className="header-cell address-header"
          onClick={() => handleSort('address')}
        >
          <AccountBalanceWalletIcon />
          <span>Address</span>
          {sortKey === 'address' && (
            sortDir === 'asc' ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />
          )}
        </div>
        
        <div 
          className="header-cell holdings-header"
          onClick={() => handleSort('balance')}
        >
          <span>Current Holdings</span>
          {sortKey === 'balance' && (
            sortDir === 'asc' ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />
          )}
        </div>
        
        <div 
          className="header-cell volume-header"
          onClick={() => handleSort('volume')}
        >
          <span>Total Volume</span>
          {sortKey === 'volume' && (
            sortDir === 'asc' ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />
          )}
        </div>
        
        <div 
          className="header-cell pnl-header"
          onClick={() => handleSort('pnl')}
        >
          <span>P&L</span>
          {sortKey === 'pnl' && (
            sortDir === 'asc' ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />
          )}
        </div>
      </div>
      
      {/* Holders List */}
      <List
        height={400}
        width="100%"
        itemCount={sorted.length}
        itemSize={(index: number) => {
          const holder = sorted[index];
          const holderId = holder.address;
          return expandedRow === holderId ? ROW_HEIGHT + 200 : ROW_HEIGHT;
        }}
        className="holders-list"
      >
        {Row}
      </List>
    </div>
  );
}
