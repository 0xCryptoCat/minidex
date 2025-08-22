# Trade Metrics Panel Specification

## Overview
A comprehensive individual and group trade metrics panel that provides both individual trade analysis and aggregate market statistics across all available trade markers. This panel should offer deep insights into trading patterns, profitability analysis, and market behavior.

## Data Sources
- **Primary**: `Trade[]` from existing trades API
- **Secondary**: `TradeMarkerCluster[]` from trade markers
- **Enriched**: Price history for PnL calculations
- **Real-time**: Current token price for unrealized PnL

## Panel Layout
```
┌─────────────────────────────────────────┐
│ Trade Analytics                         │
├─────────────────┬───────────────────────┤
│ Transaction     │ Market Statistics     │
│ Summary         │                       │
├─────────────────┼───────────────────────┤
│ Trader Analysis │ Advanced Metrics      │
├─────────────────┴───────────────────────┤
│ Visual Analytics & Charts               │
└─────────────────────────────────────────┘
```

## Core Metrics Categories

### 1. Transaction Summary
**Purpose**: High-level overview of all trading activity

#### Key Metrics:
- **Total Transactions**: `trades.length`
- **Buy Count**: `trades.filter(t => t.side === 'buy').length`
- **Sell Count**: `trades.filter(t => t.side === 'sell').length`
- **Total Buy Volume (USD)**: `∑(buy_trades.price * buy_trades.amountBase)`
- **Total Sell Volume (USD)**: `∑(sell_trades.price * sell_trades.amountBase)`
- **Net Volume (USD)**: `total_buy_volume - total_sell_volume`
- **Volume Ratio (Buy/Sell)**: `total_buy_volume / total_sell_volume`
- **Largest Single Trade**: `max(trade.price * trade.amountBase)`
- **Average Trade Size**: `mean(trade.price * trade.amountBase)`
- **Median Trade Size**: `median(trade.price * trade.amountBase)`

#### Display Format:
```
📈 Transactions Summary
├─ 1,247 Total Trades (742 Buy • 505 Sell)
├─ $2.4M Total Volume ($1.6M Buy • $800K Sell)
├─ 2.0x Buy/Sell Ratio
├─ $45.2K Largest Trade • $1.9K Average • $850 Median
└─ Last Activity: 2m ago
```

### 2. Trader Analysis (Wallet-Based)
**Purpose**: Analyze trading patterns by unique wallets

#### Key Metrics:
- **Unique Traders**: `new Set(trades.map(t => t.wallet)).size`
- **Most Active Trader**: Wallet with most transactions
- **Largest Trader by Volume**: Wallet with highest USD volume
- **New vs Returning Traders**: First-time vs repeat traders in period
- **Trader Distribution**: Small, medium, large trader categories
- **Average Trades per Trader**: `total_trades / unique_traders`
- **Trader Concentration**: % of volume from top 10 traders
- **Whale Activity**: Trades > $10K threshold

#### Advanced Trader Metrics:
- **Trader Profitability Estimate**: Based on entry/exit patterns
- **Diamond Hands Score**: Traders who hold longer positions
- **Paper Hands Score**: Traders who exit quickly
- **FOMO Indicator**: Buying at local price peaks
- **Smart Money**: Wallets that buy dips and sell peaks

#### Display Format:
```
👥 Trader Analysis
├─ 89 Unique Traders (23 New, 66 Returning)
├─ 14.0 Avg Trades/Trader
├─ Top Trader: 0x1234...abcd (47 trades, $185K volume)
├─ 🐋 Whale Activity: 12 trades > $10K (8.7% of total)
├─ 💎 Diamond Hands: 67% • 📄 Paper Hands: 33%
└─ Concentration: Top 10 traders = 45% of volume
```

### 3. Temporal Analysis
**Purpose**: Time-based trading patterns and holding behavior

#### Key Metrics:
- **Trading Session Length**: Time between first and last trade
- **Peak Trading Hours**: Most active time periods
- **Average Time Between Trades**: `(last_trade_ts - first_trade_ts) / trade_count`
- **Batch Trading Detection**: Clusters of trades within short timeframes
- **Trading Velocity**: Trades per hour/minute during active periods
- **Market Session Analysis**: Different behavior patterns by time of day

#### Holding Period Analysis:
- **Average Hold Time**: For wallets with both buy and sell transactions
- **Median Hold Time**: Less affected by outliers
- **Hold Time Distribution**: Short-term (<1h), Medium-term (1h-24h), Long-term (>24h)
- **Exit Timing**: How quickly positions are closed
- **Position Building**: Multiple buys before selling

#### Display Format:
```
⏰ Temporal Analysis
├─ 6h 23m Trading Session • Peak: 14:00-16:00 UTC
├─ 18.3s Avg Time Between Trades
├─ Hold Periods: 2h 15m Avg • 45m Median
├─ 📊 Distribution: 45% Short • 35% Medium • 20% Long
└─ 🔄 Velocity: 68 trades/hour during peak
```

### 4. Price Impact & Market Dynamics
**Purpose**: Understand how trades affect price movement

#### Key Metrics:
- **Price Impact Analysis**: Price change immediately after large trades
- **Slippage Estimation**: Actual vs expected prices for large orders
- **Market Maker vs Taker Ratio**: Estimated from trade timing
- **Support/Resistance Levels**: Price levels with high trade concentration
- **Breakout Trades**: Trades that push price beyond previous ranges
- **Mean Reversion Trades**: Trades during price pullbacks

#### Advanced Market Metrics:
- **Trade Efficiency**: How well trades are timed relative to price movements
- **Market Impact Score**: Aggregate effect of trading activity on price
- **Liquidity Consumption**: How much available liquidity trades consume
- **Order Flow Imbalance**: Buy vs sell pressure over time windows

#### Display Format:
```
💹 Market Impact
├─ High Impact Trades: 8 moves >2% price
├─ Avg Slippage: 0.3% • Max: 1.8%
├─ Support: $0.245 (47 trades) • Resistance: $0.289 (52 trades)
├─ Breakout Success: 73% (11/15 attempts)
└─ Market Efficiency: 0.68/1.0
```

### 5. Profitability Analysis (PnL Estimation)
**Purpose**: Estimate trading profitability based on observable data

#### Key Metrics:
- **Realized PnL**: For complete buy→sell cycles
- **Unrealized PnL**: For open positions (using current price)
- **Total Portfolio PnL**: Combined realized + unrealized
- **Win Rate**: Percentage of profitable trades
- **Average Win**: Average profit on winning trades
- **Average Loss**: Average loss on losing trades
- **Profit Factor**: `total_gains / total_losses`
- **Sharpe Ratio Estimate**: Risk-adjusted returns

#### Position Tracking:
- **Open Positions**: Current holdings by wallet
- **Closed Positions**: Complete trading cycles
- **Position Sizing**: How traders scale in/out
- **Risk Management**: Stop-loss behavior detection

#### Display Format:
```
💰 PnL Analysis
├─ Estimated Total PnL: +$127K (+5.3%)
├─ Realized: +$89K • Unrealized: +$38K
├─ Win Rate: 58% (145W/105L)
├─ Avg Win: +$1,247 • Avg Loss: -$892
├─ 🏆 Best Trade: +$12.4K • 💸 Worst: -$8.9K
└─ Profit Factor: 1.85
```

### 6. Risk Metrics
**Purpose**: Assess trading risk characteristics

#### Key Metrics:
- **Position Concentration**: Largest position as % of total
- **Diversification Score**: How spread out trading is
- **Volatility Exposure**: Trading during high volatility periods
- **Leverage Detection**: Signs of leveraged trading
- **Risk/Reward Ratios**: By trade size categories
- **Maximum Drawdown**: Largest peak-to-trough decline

#### Display Format:
```
⚠️ Risk Assessment
├─ Max Position: 8.4% of total volume
├─ Diversification: Medium (0.62/1.0)
├─ Volatility Exposure: 34% trades during high vol
├─ Max Drawdown: -12.3%
└─ Avg Risk/Reward: 1:1.4
```

## Visual Analytics Components

### 1. Trade Flow Diagram
- **Sankey Chart**: Visualize money flow between buy/sell
- **Color Coding**: Green for profitable flows, red for losses
- **Thickness**: Proportional to volume

### 2. Trader Heatmap
- **X-axis**: Time of day
- **Y-axis**: Trade size categories
- **Color**: Trading intensity
- **Overlay**: Price movement

### 3. PnL Waterfall Chart
- **Starting Point**: Initial investment
- **Bars**: Individual trade PnL
- **End Point**: Current portfolio value
- **Color**: Green for gains, red for losses

### 4. Hold Time Distribution
- **Histogram**: Distribution of holding periods
- **Overlays**: Profitability by hold time
- **Annotations**: Market events that triggered exits

### 5. Price Impact Scatter Plot
- **X-axis**: Trade size
- **Y-axis**: Price impact %
- **Color**: Buy vs sell
- **Trend Line**: Impact correlation

### 6. Trader Segmentation Pie Chart
- **Segments**: Whale, Large, Medium, Small traders
- **Metrics**: Count and volume contribution
- **Interactive**: Click to filter other charts

## Advanced Analytics Features

### 1. Smart Money Detection
- **Algorithm**: Identify wallets with consistently profitable timing
- **Criteria**: High win rate + good entry/exit timing
- **Visualization**: Highlight smart money trades on charts
- **Alerts**: When smart money makes significant moves

### 2. Copytrading Analysis
- **Detection**: Identify potential copytrading behavior
- **Pattern**: Similar trade timing and sizes across wallets
- **Network**: Visualize potential copying relationships

### 3. Market Regime Analysis
- **Trending**: Identify when market is trending up/down
- **Ranging**: Identify sideways market conditions
- **Behavior**: How trading patterns differ by regime

### 4. MEV Detection
- **Sandwich Attacks**: Detect front/back-running patterns
- **Arbitrage**: Identify potential arbitrage trades
- **Impact**: Measure MEV's effect on regular traders

## Implementation Architecture

### Data Pipeline
```typescript
interface TradeMetrics {
  summary: TransactionSummary;
  traders: TraderAnalysis;
  temporal: TemporalAnalysis;
  priceImpact: PriceImpactAnalysis;
  pnl: PnLAnalysis;
  risk: RiskMetrics;
  visual: VisualData;
}

interface MetricsCalculator {
  calculateSummary(trades: Trade[]): TransactionSummary;
  analyzeTraders(trades: Trade[]): TraderAnalysis;
  analyzeTemporal(trades: Trade[]): TemporalAnalysis;
  calculatePnL(trades: Trade[], currentPrice: number): PnLAnalysis;
  assessRisk(trades: Trade[]): RiskMetrics;
  generateVisualData(trades: Trade[]): VisualData;
}
```

### Performance Considerations
- **Incremental Updates**: Only recalculate when new trades arrive
- **Caching**: Cache expensive calculations
- **Web Workers**: Offload heavy computations
- **Pagination**: For large datasets
- **Debouncing**: Limit update frequency

### UI Components
```typescript
interface TradeMetricsPanel {
  // Main container with tabs/sections
  summary: SummaryCard;
  traders: TraderAnalysisCard;
  temporal: TemporalCard;
  charts: VisualizationContainer;
  
  // Configuration
  timeRange: TimeRangeSelector;
  filters: TradeFilters;
  export: DataExportButton;
}
```

## Data Requirements

### Enhancements Needed
1. **Price History**: Need historical prices for accurate PnL
2. **Token Balances**: For better position tracking
3. **Transaction Costs**: Gas fees for net PnL
4. **Market Data**: Overall market context
5. **Enhanced Wallet Info**: Wallet categorization data

### API Extensions
```typescript
interface EnhancedTrade extends Trade {
  gasUsed?: number;
  gasPriceGwei?: number;
  priceAtTime?: number;  // Token price at trade time
  marketCap?: number;    // Market cap at trade time
  volume24h?: number;    // 24h volume at trade time
}
```

## Success Metrics
- **User Engagement**: Time spent analyzing trades
- **Actionable Insights**: Users reporting useful discoveries
- **Performance**: Sub-second calculation times
- **Accuracy**: PnL estimates within 5% of actual
- **Usability**: Intuitive navigation and understanding

This specification provides a comprehensive framework for building an advanced trade metrics panel that offers deep insights into trading behavior, market dynamics, and profitability analysis.
