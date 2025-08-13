/* ---------- Core primitives ---------- */
export type Provider = 'gt' | 'ds' | 'cg';       // geckoterminal | dexscreener | coingecko
export type ChainSlug =
  | 'ethereum' | 'arbitrum' | 'polygon' | 'bsc' | 'base' | 'optimism' | 'avalanche'
  | string; // keep open for many chains

export type Address = `0x${string}`;
export type TxHash = `0x${string}`;
export type PairId = string;                     // provider-specific stable id
export type UnixSeconds = number;                // always seconds (not ms)
export type FiatCode = 'USD';                    // MVP is USD-only (extensible)

/* Timeframes supported by UI; provider may serve subset. */
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

/* ---------- Shared meta ---------- */
export interface TokenMeta {
  address: Address;
  symbol: string;
  name: string;
  icon?: string;           // URL if available
}

/* Minimal finance snapshot used across pages. */
export interface CoreFinance {
  priceUsd?: number;       // last price
  fdvUsd?: number;         // fully diluted valuation
  mcUsd?: number;          // market cap (if available)
  liqUsd?: number;         // liquidity
  vol24hUsd?: number;
  priceChange1hPct?: number;
  priceChange24hPct?: number;
}

/* Pool summary for switcher and lists. */
export interface PoolSummary {
  pairId: PairId;
  dex: string;             // e.g., "uniswap"
  version?: string;        // e.g., "v2" | "v3"
  base: string;            // base symbol (e.g., "ABC")
  quote: string;           // quote symbol (e.g., "WETH")
  chain: ChainSlug;
}

/* ---------- /api/search ---------- */
export interface SearchResult {
  chain: ChainSlug;
  token: TokenMeta;
  core: CoreFinance;
  pools: PoolSummary[];
  provider: Provider;
}

export interface SearchResponse {
  query: string;           // original user input (address)
  results: SearchResult[];
}

/* ---------- /api/pairs ---------- */
export interface PairsResponse {
  token: TokenMeta;
  pools: PoolSummary[];
  provider: Provider;
}

/* ---------- /api/ohlc ---------- */
/* Single candle (volume in base or quote as provided; we standardize to base if possible). */
export interface Candle {
  t: UnixSeconds;
  o: number; h: number; l: number; c: number;
  v?: number;            // volume (unit: base token, when known)
}

export interface OHLCResponse {
  pairId: PairId;
  tf: Timeframe;
  candles: Candle[];
  provider: Provider;
  rollupHint?: 'client' | 'server' | 'none'; // if provider lacks requested tf
}

/* ---------- /api/trades ---------- */
export type TradeSide = 'buy' | 'sell';

export interface Trade {
  ts: UnixSeconds;
  side: TradeSide;
  price: number;            // price in USD (if available); otherwise calc client
  amountBase?: number;      // filled base amount
  amountQuote?: number;     // filled quote amount in USD (if available)
  txHash?: TxHash;
  wallet?: Address;
}

export interface TradesResponse {
  pairId: PairId;
  trades: Trade[];
  provider: Provider;
  nextCursor?: string;      // reserved for future paging
}

/* ---------- /api/lists ---------- */
export type ListType = 'trending' | 'discovery' | 'leaderboard';
export type Window = '1h' | '1d' | '1w';

export interface ListItem {
  pairId: PairId;
  chain: ChainSlug;
  token: Pick<TokenMeta, 'address' | 'symbol' | 'name'>;
  priceUsd?: number;
  liqUsd?: number;
  volWindowUsd?: number;
  priceChangePct?: number;
  tradesWindow?: number;
  createdAt?: UnixSeconds;   // pool or token creation timestamp
  score?: number;            // normalized 0..1 for sorting in “trending”
  promoted?: boolean;        // monetization flag (styling only in MVP)
}

export interface ListsResponse {
  chain: ChainSlug;
  type: ListType;
  window: Window;
  items: ListItem[];
  provider: Provider | 'none';
}

/* ---------- /api/token ---------- */
export interface TokenResponse {
  chain: ChainSlug;
  address: Address;
  core: CoreFinance;
  provider: Provider;
}

/* ---------- /api/explorer (optional) ---------- */
export interface ExplorerTxPreview {
  chain: ChainSlug;
  txHash: TxHash;
  ts?: UnixSeconds;
  from?: Address;
  to?: Address;
  status?: 'success' | 'failed' | 'pending';
  valueNative?: string;     // string to preserve precision
  feeNative?: string;
  explorerUrl?: string;
  provider: 'etherscan' | string;
}

/* ---------- Error envelope for all APIs ---------- */
export interface ApiError {
  error: string;
  provider: 'none' | Provider;
}

/* ---------- Client cache shapes ---------- */
export interface CacheSearchEntry { response: SearchResponse; ts: UnixSeconds; }
export interface CachePairsEntry { response: PairsResponse; ts: UnixSeconds; }
export interface CacheOHLCEntry  { response: OHLCResponse; ts: UnixSeconds; }
export interface CacheTradesEntry { response: TradesResponse; ts: UnixSeconds; }
export interface CacheTokenEntry { response: TokenResponse; ts: UnixSeconds; }

/* ---------- Marker + metric types (UI) ---------- */
export interface TradeMarker {
  ts: UnixSeconds;
  side: TradeSide;          // color: lime (buy) / magenta (sell)
  price: number;
  size?: number;            // base
  clusterSize?: number;     // number of trades aggregated into this marker
  txHash?: TxHash;
  walletShort?: string;     // UI convenience
}

export type MetricKey =
  | 'rollingVolumeBase'
  | 'liquidityUsd'
  | 'atrLite'
  | 'returnsZScore'
  | 'tradesPerInterval';

export interface MetricSeriesPoint { t: UnixSeconds; v: number; }
export interface MetricSeries { key: MetricKey; points: MetricSeriesPoint[]; unit?: string; }
