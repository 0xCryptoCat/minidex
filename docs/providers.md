# Provider Mappings

Normalized field mapping for data providers.

## GeckoTerminal (GT)
- Primary source for all endpoints.
- Provides token icons, FDV, MC, liquidity, volume, and trade data.
- Uses `pairId` as stable pool identifier.

## Dexscreener (DS)
- Fallback when GT is unavailable or stale.
- Map DS fields to core types; some metrics (e.g., FDV) may be missing.
- `pairId` constructed from DS `pairAddress` and DEX name.

## Notes
- All client requests go through Netlify Functions.
- Missing values default to `undefined`; clients handle gracefully.
