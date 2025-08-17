# Pool Data Field Audit - DexScreener Integration

This document tracks all available fields from DexScreener API response and how they are processed and displayed in the SmallDEX application.

## Core Pool Fields

### ✅ Basic Pool Info
- `pairId` - Used as unique identifier for pool selection and routing
- `dex` - Displayed in pool selector and detail view  
- `version` (dexVersion) - Displayed in pool selector dropdown format
- `chainId` - Mapped to chain slug and displayed with chain icon
- `pairAddress` - Used for explorer links and pair identification
- `base` / `baseToken.symbol` - Displayed in pool titles and selectors
- `quote` / `quoteToken.symbol` - Displayed in pool titles and selectors

### ✅ Token Details  
- `baseToken.address` - Used for explorer links and copy buttons
- `baseToken.symbol` - Primary display symbol
- `baseToken.name` - Displayed in detail subtitle
- `quoteToken.address` - Used for explorer links and copy buttons  
- `quoteToken.symbol` - Primary display symbol
- `quoteToken.name` - Used for address labels

### ✅ Price Information
- `priceUsd` - Displayed as main price KPI with formatSmallPrice()
- `priceNative` - Displayed as secondary price in quote token terms
- `priceChange.h1` - Price change 1h displayed in price changes grid
- `priceChange.h6` - Price change 6h displayed in price changes grid  
- `priceChange.h24` - Price change 24h displayed in price changes grid

### ✅ Liquidity & Market Data
- `liquidity.usd` - Primary liquidity KPI and pool sorting
- `liquidity.base` - Available but not currently displayed
- `liquidity.quote` - Available but not currently displayed  
- `fdv` - Fully Diluted Valuation KPI
- `marketCap` - Market Cap KPI (combined with FDV if similar)

### ✅ Volume Data
- `volume.m5` - 5m volume in volume grid
- `volume.h1` - 1h volume in volume grid
- `volume.h6` - 6h volume in volume grid
- `volume.h24` - 24h volume in volume grid

### ✅ Transaction Data
- `txns.h24.buys` - 24h buy transactions with visual bar
- `txns.h24.sells` - 24h sell transactions with visual bar
- `txns.m5`, `txns.h1`, `txns.h6` - Available but not displayed

### ✅ Info Block (Rich Media)
- `info.imageUrl` - Token avatar/logo in detail header
- `info.header` - Header banner image in detail view
- `info.openGraph` - Available but not currently used
- `info.description` - Expandable description with "More" button
- `info.websites[]` - Social link buttons with icons
- `info.socials[]` - Social link buttons with type-specific icons

### ✅ Metadata
- `labels[]` - Pool labels (like "v2", "v3") 
- `pairCreatedAt` - Pool creation timestamp (available but not displayed)

## Data Flow & Caching

### ✅ API Integration
1. **Search API** (`/api/search`) - Returns complete pool data including info blocks
2. **Pairs API** (`/api/pairs`) - Enhanced to include all DexScreener fields
3. **Individual Pool Caching** - Each pool cached separately with PoolDataManager

### ✅ Pool Selection & Switching
- Pool selector dropdown shows: `base/quote [dex version address]`
- Pool switching updates all dependent views (chart, trades, detail)
- Selected pool data drives all UI displays
- Individual pool cache persists data across navigation

### ✅ UI Display Components

#### DetailView
- Header image and token avatar
- Token name, symbol, and description
- Price KPIs with subscript zero formatting
- Price change grid (5m, 1h, 6h, 24h)
- Volume grid (5m, 1h, 6h, 24h)  
- Transaction metrics with buy/sell visualization
- Address section with copy buttons and explorer links
- Social links with appropriate icons
- Pool switcher dropdown

#### Pool Selector
- Formatted as: `BASE/QUOTE [DEX VERSION ADDRESS]`
- Sorted by GeckoTerminal support, then liquidity
- Updates active pool across all views

#### Search Results
- Displays pools with complete metadata
- Shows liquidity and chain icons
- Includes provider information

## Remaining Opportunities

### 🟡 Additional Fields Available But Not Used
- `liquidity.base` / `liquidity.quote` - Could show token-specific liquidity
- `txns.m5`, `txns.h1`, `txns.h6` - Could expand transaction metrics  
- `info.openGraph` - Could be used for social sharing
- `pairCreatedAt` - Could show pool age/creation date
- `priceChange.m5` - 5-minute price change

### 🟡 Future Enhancements
- **Expandable Rows in Trades Table** - Show transaction hashes and details
- **Security Integration** - HoneyPot.is and Go+ API integration (placeholders ready)
- **Pool Comparison** - Side-by-side pool metrics
- **Historical Data** - Pool creation date and age display
- **Enhanced Social** - Better social media integration using openGraph

## Technical Implementation

### Pool Data Manager
```typescript
// Individual pool caching
poolDataManager.cachePools(pools)      // Cache all pools individually
poolDataManager.getPool(pairId)        // Retrieve specific pool data  
poolDataManager.updatePool(pool)       // Update pool data
```

### API Field Mapping
```typescript
// Complete DexScreener field mapping in search.ts and pairs.ts
{
  pairId, dex, version, base, quote, chain,
  poolAddress, pairAddress, labels,
  baseToken: { address, symbol, name },
  quoteToken: { address, symbol, name },
  info: { imageUrl, header, description, websites, socials },
  priceUsd, priceNative, liquidity, fdv, marketCap,
  txns, volume, priceChange, pairCreatedAt
}
```

## Conclusion

✅ **Complete Integration**: All major DexScreener fields are captured, cached, and displayed
✅ **Individual Pool Caching**: Each pool's data is cached separately for optimal performance  
✅ **Responsive UI**: All data displays appropriately on mobile and desktop
✅ **Error Handling**: Proper TypeScript optional handling and fallbacks
✅ **Modern UX**: Subscript zero formatting, expandable descriptions, social links

The SmallDEX application now fully utilizes the rich dataset available from DexScreener, with each pool's complete information cached individually and displayed across all relevant UI sections.
