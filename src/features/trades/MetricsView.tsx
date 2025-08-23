import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LaunchIcon from '@mui/icons-material/Launch';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { formatUsd, formatShortAddr } from '../../lib/format';
import { addressUrl } from '../../lib/explorer';
import CopyButton from '../../components/CopyButton';
import '../../styles/detail.css'; // Import for kpi-item styles

interface MetricSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  isExpanded?: boolean;
}

interface WhaleWallet {
  address: string;
  largestTrade: number;
  totalVolume: number;
  tradeCount: number;
  avgTradeSize: number;
  lastTradeTime: number;
}

interface Props {
  pairId: string;
  chain: string;
  poolAddress: string;
  tokenAddress: string;
}

export default function MetricsView({
  pairId,
  chain,
  poolAddress,
  tokenAddress,
}: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['key-metrics']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Mock whale data (replace with real data)
  const whaleWallets: WhaleWallet[] = [
    {
      address: '0x1234567890123456789012345678901234567890',
      largestTrade: 125000,
      totalVolume: 450000,
      tradeCount: 8,
      avgTradeSize: 56250,
      lastTradeTime: Date.now() - 3600000,
    },
    {
      address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      largestTrade: 89000,
      totalVolume: 234000,
      tradeCount: 5,
      avgTradeSize: 46800,
      lastTradeTime: Date.now() - 7200000,
    },
    {
      address: '0x9876543210987654321098765432109876543210',
      largestTrade: 67000,
      totalVolume: 187000,
      tradeCount: 12,
      avgTradeSize: 15583,
      lastTradeTime: Date.now() - 1800000,
    },
  ];

  const sections: MetricSection[] = [
    {
      id: 'key-metrics',
      title: 'Key Metrics',
      icon: <TrendingUpIcon />,
      content: (
        <div className="detail-kpis">
          <div className="kpi-item">
            <span className="kpi-label">24h Volume</span>
            <span className="kpi-value pos">$1.2M</span>
            <span className="kpi-change pos">+15.3%</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">24h Trades</span>
            <span className="kpi-value">2,847</span>
            <span className="kpi-change pos">+8.7%</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Unique Traders</span>
            <span className="kpi-value">423</span>
            <span className="kpi-change neg">-2.1%</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Price Impact</span>
            <span className="kpi-value">0.08%</span>
            <span className="kpi-change pos">-0.02%</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Buy/Sell Ratio</span>
            <span className="kpi-value">1.34</span>
            <span className="kpi-change pos">Bullish</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Avg Trade Size</span>
            <span className="kpi-value">$421</span>
            <span className="kpi-change pos">+12.4%</span>
          </div>
        </div>
      ),
    },
    {
      id: 'whale-activity',
      title: 'Whale Activity',
      icon: <AccountBalanceWalletIcon />,
      content: (
        <div className="whale-list">
          {whaleWallets.map((whale, index) => {
            const explorerUrl = addressUrl(chain, whale.address as `0x${string}`);
            const timeAgo = Math.floor((Date.now() - whale.lastTradeTime) / (1000 * 60));
            
            return (
              <div key={whale.address} className="whale-item">
                <div className="whale-header">
                  <div className="whale-address">
                    <span className="whale-rank">#{index + 1}</span>
                    <span className="address-text">{formatShortAddr(whale.address)}</span>
                    <CopyButton text={whale.address} />
                    {explorerUrl && (
                      <a href={explorerUrl} target="_blank" rel="noreferrer" className="explorer-link">
                        <LaunchIcon fontSize="small" />
                      </a>
                    )}
                  </div>
                  <div className="whale-largest">{formatUsd(whale.largestTrade)}</div>
                </div>
                <div className="whale-stats">
                  <div className="whale-stat">
                    <span className="stat-label">Total Volume</span>
                    <span className="stat-value">{formatUsd(whale.totalVolume)}</span>
                  </div>
                  <div className="whale-stat">
                    <span className="stat-label">Trades</span>
                    <span className="stat-value">{whale.tradeCount}</span>
                  </div>
                  <div className="whale-stat">
                    <span className="stat-label">Avg Size</span>
                    <span className="stat-value">{formatUsd(whale.avgTradeSize)}</span>
                  </div>
                  <div className="whale-stat">
                    <span className="stat-label">Last Trade</span>
                    <span className="stat-value">{timeAgo < 60 ? `${timeAgo}m` : `${Math.floor(timeAgo/60)}h`} ago</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      id: 'time-patterns',
      title: 'Time Patterns',
      icon: <AccessTimeIcon />,
      content: (
        <div className="detail-kpis">
          <div className="kpi-item">
            <span className="kpi-label">Peak Hour</span>
            <span className="kpi-value">14:00 UTC</span>
            <span className="kpi-change">$234K volume</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Quiet Hour</span>
            <span className="kpi-value">05:00 UTC</span>
            <span className="kpi-change">$12K volume</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Weekend Activity</span>
            <span className="kpi-value neg">-23%</span>
            <span className="kpi-change">vs weekdays</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Response Time</span>
            <span className="kpi-value">12.3s</span>
            <span className="kpi-change">avg execution</span>
          </div>
        </div>
      ),
    },
    {
      id: 'trader-behavior',
      title: 'Trader Behavior',
      icon: <BarChartIcon />,
      content: (
        <div className="detail-kpis">
          <div className="kpi-item">
            <span className="kpi-label">New Wallets</span>
            <span className="kpi-value">45</span>
            <span className="kpi-change">last 24h</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Repeat Traders</span>
            <span className="kpi-value pos">67%</span>
            <span className="kpi-change">return rate</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Bot Detection</span>
            <span className="kpi-value">12%</span>
            <span className="kpi-change">estimated</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Whale Trades</span>
            <span className="kpi-value">8 trades</span>
            <span className="kpi-change">&gt;$10K size</span>
          </div>
          <div className="kpi-item kpi-wide">
            <span className="kpi-label">Trade Size Distribution</span>
            <div className="size-distribution">
              <div className="size-bar">
                <span className="size-label">$0-100</span>
                <div className="size-progress">
                  <div className="size-fill" style={{ width: '60%' }}></div>
                </div>
                <span className="size-percent">60%</span>
              </div>
              <div className="size-bar">
                <span className="size-label">$100-1K</span>
                <div className="size-progress">
                  <div className="size-fill" style={{ width: '25%' }}></div>
                </div>
                <span className="size-percent">25%</span>
              </div>
              <div className="size-bar">
                <span className="size-label">$1K-10K</span>
                <div className="size-progress">
                  <div className="size-fill" style={{ width: '12%' }}></div>
                </div>
                <span className="size-percent">12%</span>
              </div>
              <div className="size-bar">
                <span className="size-label">$10K+</span>
                <div className="size-progress">
                  <div className="size-fill" style={{ width: '3%' }}></div>
                </div>
                <span className="size-percent">3%</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="metrics-view">
      <div className="metrics-sections">
        {sections.map((section) => (
          <div key={section.id} className="metric-section">
            <div
              className="metric-section-header"
              onClick={() => toggleSection(section.id)}
            >
              <div className="section-title">
                <div className="section-icon">{section.icon}</div>
                <span>{section.title}</span>
              </div>
              <div className="section-toggle">
                {expandedSections.has(section.id) ? (
                  <ExpandLessIcon />
                ) : (
                  <ExpandMoreIcon />
                )}
              </div>
            </div>
            
            {expandedSections.has(section.id) && (
              <div className="metric-section-content">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
