# Provider Mappings

Normalized field mapping for data providers.

## Dexscreener (DS)
- Primary source for all endpoints.
- Provides token and pool data without authentication.
- `pairId` constructed from DS `pairAddress` and DEX name.

## GeckoTerminal (GT)
- Fallback when DS is unavailable or stale.
- Offers richer metadata such as token icons and FDV.
- Uses its own `pairId` as stable pool identifier.

## Notes
- All client requests go through Netlify Functions.
- Missing values default to `undefined`; clients handle gracefully.
- Lists endpoints (`trending`, `discovery`, `leaderboard`) pull raw entries
  from the active provider and normalize to a common shape. Each entry may
  include a `promoted` flag. A composite `score` is computed from volume
  change, price change, and trade count to provide a deterministic ranking
  across chains and windows.
