import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';

interface MetricSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  isExpanded?: boolean;
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['trading-metrics']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const sections: MetricSection[] = [
    {
      id: 'trading-metrics',
      title: 'Trading Metrics',
      icon: <TrendingUpIcon />,
      content: (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">24h Volume</div>
            <div className="metric-value">$1.2M</div>
            <div className="metric-change positive">+15.3%</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">24h Transactions</div>
            <div className="metric-value">2,847</div>
            <div className="metric-change positive">+8.7%</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Unique Traders</div>
            <div className="metric-value">423</div>
            <div className="metric-change negative">-2.1%</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Avg Trade Size</div>
            <div className="metric-value">$421</div>
            <div className="metric-change positive">+12.4%</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Buy/Sell Ratio</div>
            <div className="metric-value">1.34</div>
            <div className="metric-change positive">+0.12</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Price Impact</div>
            <div className="metric-value">0.08%</div>
            <div className="metric-change positive">-0.02%</div>
          </div>
        </div>
      ),
    },
    {
      id: 'time-analysis',
      title: 'Time Analysis',
      icon: <AccessTimeIcon />,
      content: (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Peak Hour</div>
            <div className="metric-value">14:00 UTC</div>
            <div className="metric-subtitle">Highest volume</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Quiet Hour</div>
            <div className="metric-value">05:00 UTC</div>
            <div className="metric-subtitle">Lowest volume</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Avg Response Time</div>
            <div className="metric-value">12.3s</div>
            <div className="metric-subtitle">Trade execution</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Weekend Activity</div>
            <div className="metric-value">-23%</div>
            <div className="metric-subtitle">vs weekdays</div>
          </div>
        </div>
      ),
    },
    {
      id: 'distribution',
      title: 'Trade Distribution',
      icon: <BarChartIcon />,
      content: (
        <div className="metrics-grid">
          <div className="metric-card wide">
            <div className="metric-label">Trade Size Distribution</div>
            <div className="distribution-chart">
              <div className="distribution-bar">
                <div className="bar-label">$0-100</div>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: '60%' }}></div>
                </div>
                <div className="bar-value">60%</div>
              </div>
              <div className="distribution-bar">
                <div className="bar-label">$100-1K</div>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: '25%' }}></div>
                </div>
                <div className="bar-value">25%</div>
              </div>
              <div className="distribution-bar">
                <div className="bar-label">$1K-10K</div>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: '12%' }}></div>
                </div>
                <div className="bar-value">12%</div>
              </div>
              <div className="distribution-bar">
                <div className="bar-label">$10K+</div>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: '3%' }}></div>
                </div>
                <div className="bar-value">3%</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'wallet-analysis',
      title: 'Wallet Analysis',
      icon: <PieChartIcon />,
      content: (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">New Wallets</div>
            <div className="metric-value">45</div>
            <div className="metric-subtitle">Last 24h</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Whale Activity</div>
            <div className="metric-value">8 trades</div>
            <div className="metric-subtitle">&gt;$10K trades</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Bot Detection</div>
            <div className="metric-value">12%</div>
            <div className="metric-subtitle">Estimated bots</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Repeat Traders</div>
            <div className="metric-value">67%</div>
            <div className="metric-subtitle">Return rate</div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="metrics-view">
      <div className="metrics-header">
        <div className="metrics-title">Trading Analytics</div>
        <div className="metrics-subtitle">
          Comprehensive trading metrics and patterns analysis
        </div>
      </div>

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
