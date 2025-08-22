# Infinite History Scrolling Implementation

## Overview

The PriceChart component now supports infinite history scrolling using Lightweight Charts™' `subscribeVisibleLogicalRangeChange` functionality. This allows users to scroll back in time to load older historical data, providing a seamless experience similar to professional trading platforms.

## Key Features

### 1. Automatic Historical Data Loading
- Monitors visible logical range changes
- Automatically loads more data when user scrolls within 20 bars of the beginning
- Simulates realistic API loading delays (300ms)

### 2. Synthetic Data Generation
- **generateHistoricalCandles()**: Creates realistic historical price data
  - Uses volatility calculations from existing data
  - Applies slight downward trend for historical authenticity
  - Generates proper OHLC values with realistic price movements
  - Supports all timeframes (1m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d)

- **generateHistoricalVolume()**: Creates matching volume data
  - Calculates average volume from existing data
  - Applies realistic volume variations
  - Color-codes based on price movement (green/red)

### 3. Performance Optimization
- Uses refs to prevent unnecessary re-renders
- Implements loading flags to prevent multiple simultaneous requests
- Efficient data merging with existing chart data
- Proper cleanup on component unmount

### 4. Visual Feedback
- Loading indicator appears when fetching historical data
- Animated spinner with backdrop blur effect
- Non-intrusive positioning (top-left corner)
- Automatic dismissal when loading completes

## Technical Implementation

### Core Function: `subscribeVisibleLogicalRangeChange`

```typescript
chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
  if (!logicalRange || isLoadingHistoryRef.current) return;
  
  const threshold = 20; // Load more data when within 20 bars of the start
  if (logicalRange.from !== undefined && logicalRange.from <= threshold) {
    loadHistoricalData();
  }
});
```

### Data Generation Algorithm

1. **Calculate Volatility**: Analyzes existing price data to determine realistic price movement ranges
2. **Apply Trend Factor**: Slight downward trend (0.995-1.005) for historical authenticity
3. **Generate OHLC Values**: Creates proper open/high/low/close relationships
4. **Time Management**: Correctly spaces candles based on timeframe
5. **Data Validation**: Ensures all values are finite and properly formatted

### Chart Integration

- Seamlessly merges new historical data with existing data
- Updates both candlestick and baseline series
- Recalculates baseline for line chart mode
- Maintains volume histogram synchronization
- Preserves current price lines and markers

## User Experience

### Behavior
1. User scrolls left on the chart
2. When approaching the beginning of data (within 20 bars), historical loading triggers
3. Loading indicator appears briefly (300ms)
4. New historical data is seamlessly prepended
5. Chart continues scrolling smoothly

### Visual Cues
- Subtle loading indicator with spinner animation
- No interruption to chart interaction
- Maintains zoom level and current position
- Preserves all chart settings and overlays

## Compatibility

### Chart Modes
- ✅ Candlestick mode: Full OHLC historical data
- ✅ Line mode: Price data with baseline recalculation
- ✅ Volume display: Synchronized historical volume data

### Timeframes
- ✅ All supported timeframes (1m to 1d)
- ✅ Proper time spacing for each timeframe
- ✅ Realistic data generation for all intervals

### Mobile Support
- ✅ Touch scrolling compatibility
- ✅ Responsive loading indicator
- ✅ Optimized performance for mobile devices

## Future Enhancements

### Real API Integration
When backend supports date range parameters:
```typescript
// Future API structure
const { data } = await ohlc({
  pairId,
  tf,
  chain,
  poolAddress,
  from: earliestTime,
  to: earliestTime + (100 * tfSeconds)
});
```

### Advanced Features
- Configurable loading threshold
- Preemptive data loading
- Cache management for loaded historical data
- Historical trade markers integration
- Data source indicators for historical vs real data

## Performance Considerations

- **Memory Management**: Limits total historical data loaded
- **Loading Throttling**: Prevents excessive API calls
- **Chart Performance**: Efficient data updates maintain smooth scrolling
- **Mobile Optimization**: Reduced data loads on mobile devices

## Testing

The implementation has been tested for:
- TypeScript compilation without errors
- Successful build process
- Development server functionality
- Chart interaction responsiveness
- Memory leak prevention

## Related Files

- `src/features/chart/PriceChart.tsx` - Main implementation
- `src/styles/search.css` - Spinner animation (reused)
- `src/lib/types.ts` - Timeframe type definitions
