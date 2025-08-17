/* ---------- Core primitives ---------- */
export type Provider = 'gt' | 'ds' | 'cg' | 'synthetic' | 'none';       // geckoterminal | dexscreener | coingecko | synthetic | none
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
  poolAddress?: Address;   // contract address for GeckoTerminal
  pairAddress?: Address;   // pair contract address
  liqUsd?: number;         // liquidity for default selection
  gtSupported?: boolean;   // whether GT supports this pool
  labels?: string[];       // e.g., ["v2"]
  baseToken?: { address: Address; symbol: string; name: string };
  quoteToken?: { address: Address; symbol: string; name: string };
  info?: {                 // complete info object per pool
    imageUrl?: string;
    header?: string;
    openGraph?: string;
    description?: string;
    websites?: { label: string; url: string }[];
    socials?: { type: string; url: string }[];
  };
  priceUsd?: number;
  priceNative?: number;
  txns?: {
    m5?: { buys: number; sells: number };
    h1?: { buys: number; sells: number };
    h6?: { buys: number; sells: number };
    h24?: { buys: number; sells: number };
  };
  volume?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  priceChange?: {
    h1?: number;
    h6?: number;
    h24?: number;
  };
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
}

/* ---------- /api/search ---------- */
export interface SearchTokenSummary {
  address: Address;
  symbol: string;
  name: string;
  icon?: string;
  priceUsd: number;
  priceChange24h?: number; // 24h price change percentage
  liqUsd: number;
  vol24hUsd: number;
  chainIcons: string[]; // up to 3 chains by liquidity
  poolCount: number;
  gtSupported: boolean; // true if any pool is supported
  provider: Provider;
  chainCount?: number; // total distinct chains
  pools?: PoolSummary[]; // underlying pools for navigation
}

export interface SearchResponse {
  query: string;           // original user input (address)
  results: SearchTokenSummary[];
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
  effectiveTf?: Timeframe; // actual timeframe served if different
}

/* ---------- /api/trades ---------- */
export type TradeSide = 'buy' | 'sell';

export interface Trade {
  ts: UnixSeconds;
  side: TradeSide;
  price: number;            // price in USD (token-centric)
  amountBase?: number;      // filled amount of token of interest
  amountQuote?: number;     // filled amount of counter token
  txHash?: TxHash;
  wallet?: Address;
  blockNumber?: number;
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
export interface TokenLinks {
  website?: string;
  explorer?: string;
  twitter?: string;
  telegram?: string;
}

export interface PoolTxCount {
  buys: number;
  sells: number;
}

export interface PoolDetail extends PoolSummary {
  pairAddress?: Address;
  pairUrl?: string;
  baseToken: { address: Address; symbol: string; name: string };
  quoteToken: { address: Address; symbol: string; name: string };
  priceNative?: number;
  priceUsd?: number;
  liquidity?: { usd?: number; base?: number; quote?: number };
  fdv?: number;
  marketCap?: number;
  txns?: { m5?: PoolTxCount; h1?: PoolTxCount; h6?: PoolTxCount; h24?: PoolTxCount };
  volume?: { m5?: number; h1?: number; h6?: number; h24?: number };
  priceChange?: { m5?: number; h1?: number; h6?: number; h24?: number };
  pairCreatedAt?: number; // ms
  gtSupported?: boolean;
}

export interface TokenInfoBlock {
  imageUrl?: string;
  header?: string;
  description?: string;
  websites?: { label: string; url: string }[];
  socials?: { type: string; url: string }[];
}

export interface TokenKpis {
  priceUsd?: number;
  priceNative?: number;
  liqUsd?: number;
  fdvUsd?: number;
  mcUsd?: number;
  priceChange24hPct?: number;
  age?: { days: number; hours: number };
}

export interface TokenDetail {
  info?: TokenInfoBlock;
  kpis: TokenKpis;
  pools: PoolDetail[];
  provider: Provider;
}

export type TokenResponse = TokenDetail;

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

/* ---------- Response metadata ---------- */
export interface FetchMeta {
  provider?: string | null;
  tried?: string | null;
  effectiveTf?: string | null;
  remapped?: string | null;
  items?: string | null;
  token?: string | null;
  priceSource?: string | null;
  invalidPool?: string | null;
  cgAuth?: string | null;
}

export interface ApiResult<T> {
  data: T;
  meta: FetchMeta;
}

/* ---------- Client cache shapes ---------- */
export interface CacheSearchEntry {
  response: ApiResult<SearchResponse>;
  ts: UnixSeconds;
}
export interface CachePairsEntry {
  response: ApiResult<PairsResponse>;
  ts: UnixSeconds;
}
export interface CacheOHLCEntry {
  response: ApiResult<OHLCResponse>;
  ts: UnixSeconds;
}
export interface CacheTradesEntry {
  response: ApiResult<TradesResponse>;
  ts: UnixSeconds;
}
export interface CacheTokenEntry {
  response: ApiResult<TokenResponse>;
  ts: UnixSeconds;
}

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
