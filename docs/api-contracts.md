# API Contracts

Defines request and response shapes for Netlify Functions. See `/src/lib/types.ts` for TypeScript interfaces.

During development the functions may return data from local fixtures when `USE_FIXTURES=true`.
In production they fetch live data from Dexscreener first and fall back to GeckoTerminal on failure.

## `/api/search`
- **Method:** GET
- **Query params:** `query` (token address, required)
- **Notes:** legacy `address` param accepted for backward compatibility.
- **Response:** `SearchResponse` with array of cross‑chain matches.

## `/api/pairs`
- **Method:** GET
- **Query params:** `chain`, `address`
- **Response:** `PairsResponse` with token meta and available pools.

## `/api/ohlc`
- **Method:** GET
- **Query params:** `pairId`, `tf` (`1m|5m|15m|1h|4h|1d`)
- **Response:** `OHLCResponse` containing candles and optional rollup hint.

## `/api/trades`
- **Method:** GET
- **Query params:** `pairId`
- **Response:** `TradesResponse` with recent trades list.

## `/api/lists`
- **Method:** GET
- **Query params:** `chain`, `type` (`trending|discovery|leaderboard`), `window` (`1h|1d|1w`), `limit?`
- **Response:** `ListsResponse` for trending, discovery, or leaderboard items.

## `/api/explorer` (optional)
- **Method:** GET
- **Query params:** `chain`, `txHash`
- **Response:** `ExplorerTxPreview` for quick explorer lookups.

## Error Envelope
Every endpoint may return `{ "error": string, "provider": "none" | Provider }` on failure.
