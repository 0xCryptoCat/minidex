import { useState, useEffect } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LaunchIcon from '@mui/icons-material/Launch';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { formatUsd, formatShortAddr, formatCompact } from '../../lib/format';
import { addressUrl } from '../../lib/explorer';
import CopyButton from '../../components/CopyButton';
import { trades } from '../../lib/api';
import type { Trade } from '../../lib/types';
import '../../styles/detail.css'; // Import for kpi-item styles

interface MetricSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  isExpanded?: boolean;
}

interface MetricsData {
  totalVolume24h: number;
  totalTrades24h: number;
  uniqueWallets24h: number;
  avgTradeSize: number;
  whaleWallets: WhaleWallet[];
  buyPressure: number;
  sellPressure: number;
  priceChange24h: number;
  volumeChange24h: number;
  largestTrade24h: number;
  topWalletsByVolume: WhaleWallet[];
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
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to derive metrics from trades data
  const deriveMetricsFromTrades = (tradesData: Trade[]): MetricsData => {
    if (!tradesData || tradesData.length === 0) {
      return {
        totalVolume24h: 0,
        totalTrades24h: 0,
        uniqueWallets24h: 0,
        avgTradeSize: 0,
        whaleWallets: [],
        buyPressure: 0,
        sellPressure: 0,
        priceChange24h: 0,
        volumeChange24h: 0,
        largestTrade24h: 0,
        topWalletsByVolume: [],
      };
    }

    const now = Date.now() / 1000; // Current timestamp in seconds
    const twentyFourHoursAgo = now - 86400; // 24 hours ago

    // Filter trades from last 24 hours
    const trades24h = tradesData.filter(trade => trade.ts >= twentyFourHoursAgo);
    
    // Calculate basic metrics
    const totalTrades24h = trades24h.length;
    const uniqueWallets24h = new Set(trades24h.map(t => t.wallet).filter(Boolean)).size;
    
    let totalVolume24h = 0;
    let buyVolume = 0;
    let sellVolume = 0;
    let largestTrade24h = 0;

    trades24h.forEach(trade => {
      // Use only volumeUSD (volume_in_usd from API) - no fallbacks
      const volume = trade.volumeUSD || 0;
      totalVolume24h += volume;
      
      if (trade.side === 'buy') {
        buyVolume += volume;
      } else {
        sellVolume += volume;
      }

      largestTrade24h = Math.max(largestTrade24h, volume);
    });

    const avgTradeSize = totalVolume24h / Math.max(totalTrades24h, 1);
    const buyPressure = (buyVolume / Math.max(totalVolume24h, 1)) * 100;
    const sellPressure = (sellVolume / Math.max(totalVolume24h, 1)) * 100;

    // Calculate price change (first vs last trade in 24h)
    const priceChange24h = trades24h.length >= 2 
      ? ((trades24h[0].price - trades24h[trades24h.length - 1].price) / trades24h[trades24h.length - 1].price) * 100
      : 0;

    // Group trades by wallet to find whale wallets
    const walletMap = new Map<string, {
      totalVolume: number;
      tradeCount: number;
      largestTrade: number;
      lastTradeTime: number;
    }>();

    trades24h.forEach(trade => {
      if (!trade.wallet) return;
      
      // Use only volumeUSD (volume_in_usd from API) - no fallbacks
      const volume = trade.volumeUSD || 0;
      
      if (!walletMap.has(trade.wallet)) {
        walletMap.set(trade.wallet, {
          totalVolume: 0,
          tradeCount: 0,
          largestTrade: 0,
          lastTradeTime: trade.ts,
        });
      }

      const walletData = walletMap.get(trade.wallet)!;
      walletData.totalVolume += volume;
      walletData.tradeCount++;
      walletData.largestTrade = Math.max(walletData.largestTrade, volume);
      walletData.lastTradeTime = Math.max(walletData.lastTradeTime, trade.ts);
    });

    // Create whale wallets array (top traders by volume)
    const whaleWallets: WhaleWallet[] = Array.from(walletMap.entries())
      .map(([address, data]) => ({
        address,
        largestTrade: data.largestTrade,
        totalVolume: data.totalVolume,
        tradeCount: data.tradeCount,
        avgTradeSize: data.totalVolume / data.tradeCount,
        lastTradeTime: data.lastTradeTime * 1000, // Convert to milliseconds
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 10); // Top 10 whales

    return {
      totalVolume24h,
      totalTrades24h,
      uniqueWallets24h,
      avgTradeSize,
      whaleWallets: whaleWallets.slice(0, 3), // Top 3 for display
      buyPressure,
      sellPressure,
      priceChange24h,
      volumeChange24h: 0, // Would need historical data to calculate
      largestTrade24h,
      topWalletsByVolume: whaleWallets,
    };
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    trades({ pairId, chain, poolAddress, tokenAddress })
      .then(({ data }) => {
        if (cancelled) return;
        
        const metrics = deriveMetricsFromTrades(data.trades || []);
        setMetricsData(metrics);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pairId, chain, poolAddress, tokenAddress]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="trades-view">
        <div className="trades-loader">
          <div>Loading metrics...</div>
        </div>
      </div>
    );
  }

  if (!metricsData) {
    return (
      <div className="trades-view">
        <div className="trades-no-data">No metrics data available</div>
      </div>
    );
  }

  // Replace mock whale data with real data
  const whaleWallets = metricsData.whaleWallets;

  const sections: MetricSection[] = [
    {
      id: 'key-metrics',
      title: 'Key Metrics',
      icon: <TrendingUpIcon />,
      content: (
        <div className="detail-kpis">
          <div className="kpi-item">
            <span className="kpi-label">24h Volume</span>
            <span className="kpi-value pos">{formatUsd(metricsData.totalVolume24h)}</span>
            <span className="kpi-change pos">
              {metricsData.volumeChange24h > 0 ? '+' : ''}{metricsData.volumeChange24h.toFixed(1)}%
            </span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">24h Trades</span>
            <span className="kpi-value">{formatCompact(metricsData.totalTrades24h)}</span>
            <span className="kpi-change pos">-</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Unique Wallets</span>
            <span className="kpi-value">{formatCompact(metricsData.uniqueWallets24h)}</span>
            <span className="kpi-change pos">-</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Avg Trade Size</span>
            <span className="kpi-value">{formatUsd(metricsData.avgTradeSize)}</span>
            <span className="kpi-change pos">-</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Buy Pressure</span>
            <span className="kpi-value">{metricsData.buyPressure.toFixed(1)}%</span>
            <span className={`kpi-change ${metricsData.buyPressure > 50 ? 'pos' : 'neg'}`}>
              vs {metricsData.sellPressure.toFixed(1)}% sell
            </span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Largest Trade</span>
            <span className="kpi-value">{formatUsd(metricsData.largestTrade24h)}</span>
            <span className="kpi-change">24h</span>
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
            <span className="kpi-label">Total Volume</span>
            <span className="kpi-value">{formatUsd(metricsData.totalVolume24h)}</span>
            <span className="kpi-change">24h period</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Trading Hours</span>
            <span className="kpi-value">24/7</span>
            <span className="kpi-change">continuous</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Activity Level</span>
            <span className="kpi-value pos">Active</span>
            <span className="kpi-change">{metricsData.totalTrades24h} trades</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Market Trend</span>
            <span className={`kpi-value ${metricsData.buyPressure > 50 ? 'pos' : 'neg'}`}>
              {metricsData.buyPressure > 50 ? 'Bullish' : 'Bearish'}
            </span>
            <span className="kpi-change">{metricsData.buyPressure.toFixed(0)}% buy pressure</span>
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
            <span className="kpi-value">{metricsData.uniqueWallets24h}</span>
            <span className="kpi-change">last 24h</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Total Traders</span>
            <span className="kpi-value pos">{metricsData.uniqueWallets24h}</span>
            <span className="kpi-change">unique wallets</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Avg Trades/Wallet</span>
            <span className="kpi-value">{(metricsData.totalTrades24h / Math.max(metricsData.uniqueWallets24h, 1)).toFixed(1)}</span>
            <span className="kpi-change">per trader</span>
          </div>
          <div className="kpi-item">
            <span className="kpi-label">Whale Traders</span>
            <span className="kpi-value">{metricsData.whaleWallets.length} wallets</span>
            <span className="kpi-change">&gt;$1K volume</span>
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
