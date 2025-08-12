# API Contracts

Defines request and response shapes for Netlify Functions. See `/src/lib/types.ts` for TypeScript interfaces.

## `/api/search`
- **Method:** GET
- **Query params:** `address` (token address, required)
- **Response:** `SearchResponse` with array of cross‑chain matches.

## `/api/pairs`
- **Method:** GET
- **Query params:** `chain`, `address`
- **Response:** `PairsResponse` with token meta and available pools.

## `/api/ohlc`
- **Method:** GET
- **Query params:** `pairId`, `tf`
- **Response:** `OHLCResponse` containing candles and optional rollup hint.

## `/api/trades`
- **Method:** GET
- **Query params:** `pairId`
- **Response:** `TradesResponse` with recent trades list.

## `/api/lists`
- **Method:** GET
- **Query params:** `chain`, `type`, `window`
- **Response:** `ListsResponse` for trending, discovery, or leaderboard items.

## `/api/explorer` (optional)
- **Method:** GET
- **Query params:** `chain`, `txHash`
- **Response:** `ExplorerTxPreview` for quick explorer lookups.

## Error Envelope
Every endpoint may return `{ "error": string, "provider": "none" | Provider }` on failure.
