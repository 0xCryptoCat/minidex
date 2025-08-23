import { useEffect, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LaunchIcon from '@mui/icons-material/Launch';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { formatUsd, formatShortAddr, formatCompact } from '../../lib/format';
import { addressUrl } from '../../lib/explorer';
import CopyButton from '../../components/CopyButton';
import ChartLoader from '../../components/ChartLoader';

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
}

interface Props {
  pairId: string;
  chain: string;
  poolAddress: string;
  tokenAddress: string;
  baseSymbol?: string;
}

const ROW_HEIGHT = 72;

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

  useEffect(() => {
    // TODO: Implement actual holders data fetching
    // For now, show mock data
    const mockHolders: HolderData[] = [
      {
        address: '0x1234567890123456789012345678901234567890',
        isContract: false,
        balance: 1250000,
        balanceUsd: 15750,
        volume: 500000,
        volumeUsd: 6300,
        pnl: 250000,
        pnlUsd: 3150,
        transactions: 23,
        firstSeen: Date.now() - 86400000 * 7,
        lastSeen: Date.now() - 3600000,
      },
      {
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        isContract: true,
        balance: 890000,
        balanceUsd: 11230,
        volume: 1200000,
        volumeUsd: 15120,
        pnl: -50000,
        pnlUsd: -630,
        transactions: 45,
        firstSeen: Date.now() - 86400000 * 14,
        lastSeen: Date.now() - 7200000,
      },
      // Add more mock data...
    ];

    setTimeout(() => {
      setHolders(mockHolders);
      setIsLoading(false);
    }, 1000);
  }, [pairId, chain, poolAddress, tokenAddress]);

  const renderHolderRow = ({ index, style }: { index: number; style: any }) => {
    const holder = holders[index];
    if (!holder) return null;

    const explorerUrl = addressUrl(chain, holder.address as `0x${string}`);
    const pnlColor = holder.pnlUsd >= 0 ? 'var(--buy-primary)' : 'var(--sell-primary)';

    return (
      <div style={style} className="holder-row">
        <div className="holder-main">
          <div className="holder-info">
            <div className="holder-address">
              {holder.isContract ? (
                <BusinessCenterIcon className="holder-icon contract" />
              ) : (
                <AccountBalanceWalletIcon className="holder-icon wallet" />
              )}
              <span className="address-text">{formatShortAddr(holder.address)}</span>
              <CopyButton text={holder.address} />
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="explorer-link"
                >
                  <LaunchIcon fontSize="small" />
                </a>
              )}
            </div>
            <div className="holder-type">
              {holder.isContract ? 'Contract' : 'Wallet'} • {holder.transactions} txs
            </div>
          </div>

          <div className="holder-metrics">
            <div className="metric">
              <div className="metric-label">Holdings</div>
              <div className="metric-value">
                {formatCompact(holder.balance)} {baseSymbol}
              </div>
              <div className="metric-usd">{formatUsd(holder.balanceUsd)}</div>
            </div>

            <div className="metric">
              <div className="metric-label">Volume</div>
              <div className="metric-value">
                {formatCompact(holder.volume)} {baseSymbol}
              </div>
              <div className="metric-usd">{formatUsd(holder.volumeUsd)}</div>
            </div>

            <div className="metric">
              <div className="metric-label">P&L</div>
              <div className="metric-value" style={{ color: pnlColor }}>
                {holder.pnlUsd >= 0 ? '+' : ''}{formatCompact(holder.pnl)} {baseSymbol}
              </div>
              <div className="metric-usd" style={{ color: pnlColor }}>
                {holder.pnlUsd >= 0 ? '+' : ''}{formatUsd(holder.pnlUsd)}
              </div>
            </div>
          </div>

          <div className="holder-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (holder.balanceUsd / Math.max(...holders.map(h => h.balanceUsd))) * 100)}%`,
                  background: holder.balanceUsd > 0 ? 'var(--brand-primary)' : 'var(--text-muted)',
                }}
              />
            </div>
            <div className="progress-label">
              {((holder.balanceUsd / holders.reduce((sum, h) => sum + h.balanceUsd, 0)) * 100).toFixed(1)}% of total
            </div>
          </div>
        </div>
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
      <div className="holders-header">
        <div className="holders-title">Top Holders ({holders.length})</div>
        <div className="holders-subtitle">
          Showing wallets and contracts with significant holdings
        </div>
      </div>
      
      <List
        height={400}
        width="100%"
        itemCount={holders.length}
        itemSize={() => ROW_HEIGHT}
        className="holders-list"
      >
        {renderHolderRow}
      </List>
    </div>
  );
}
