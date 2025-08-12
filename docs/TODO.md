TODOs/spec notes.

# /src/app (routing, shell, theming)

**Prompt for `/src/app/index.tsx`**
Goal: bootstrap the SPA with Vite/React, dark theme, and global error boundary.
Do:

* Initialize app root, apply dark palette (black/dark-gray/gray), neon accents (lime for positive/buys, magenta for negative/sells), focus rings.
* Provide Router with routes: `/` (search), `/t/:chain/:address/:pairId?` (chart page), `/lists/:chain/:listType` (trending/discovery/leaderboard).
* Persist top header with menu button + search pill across all views. Bottom page-type tabs live inside chart route only.
* Wire global stores (Zustand) providers.
  Done when: app renders routes, theme applies, header visible everywhere, no page reloads on route changes.

**Prompt for `/src/app/routes.tsx`**
Goal: centralize route objects and lazy loading.
Do: define route constants, lazy import feature pages, handle 404 → redirect to `/`.
Done when: navigation via links or programmatic pushes works and code-splitting chunks are produced.

**Prompt for `/src/app/theme.css`**
Goal: minimal iOS-inspired dark theme.
Do: set CSS variables for background, surface, text tiers, borders, lime/magenta/cyan accents; ensure 44px touch targets; reduced-motion support.
Done when: components inherit tokens and color usage is consistent.

# /src/components (reusable UI)

**Prompt for `/src/components/Header.tsx`**
Goal: fixed header with menu button, search pill (address input trigger), and provider-status badge.
Do: emit callbacks for search open, show current provider (gt/ds) and “degraded” state; keep height compact.
Done when: appears on all pages, never overlaps content, works on iOS Safari.

**Prompt for `/src/components/BottomTabs.tsx`**
Goal: bottom row page-type switcher for chart route.
Do: render 4 tabs: Detail, Chart, Chart+TXs, TXs-only; announce selection via ARIA; keep sticky at bottom.
Done when: switching tab updates view instantly without route reload.

**Prompt for `/src/components/PillSwitch.tsx`**
Goal: pill-style segmented control (used for pool switcher and timeframes).
Do: keyboard accessible, scrollable when many options.
Done when: selection state syncs with store and URL.

**Prompt for `/src/components/VirtualList.tsx`**
Goal: virtualized scroller for trades and lists.
Do: windowing, sticky header support, smooth keyboard/scroll on mobile.
Done when: 10k items render smoothly at 60fps on mid-range phone.

# /src/features/search

**Prompt for `/src/features/search/SearchPage.tsx`**
Goal: address-first search page; **no preloading** token pages.
Do: input accepts token address, optional chain filter; calls `/api/search` and shows cross-chain results with icon, name, price, liq, 24h vol, % changes, pool count.
Done when: selecting a result navigates to chart route with parameters, and only minimal data was fetched to render results.

**Prompt for `/src/features/search/SearchResultItem.tsx`**
Goal: single row representing a token on a chain.
Do: show provider badge, price, liq, vol, pct; tap target opens chart; avoid overflow.
Done when: row looks good on narrow mobile widths.

# /src/features/chart

**Prompt for `/src/features/chart/ChartPage.tsx`**
Goal: container for the 4 chart views, header below, bottom tabs visible; manages polling cadence and visibility pause.
Do: read `:chain/:address/:pairId?` from URL; orchestrate data fetches from caches; ensure pool switcher (if >1 pool) appears above content except in Detail view.
Done when: view toggles are instant; polling (5s OHLC, 3s trades) runs only when visible; backoff on 429/5xx.

**Prompt for `/src/features/chart/DetailView.tsx`**
Goal: KPI-rich detail display.
Do: price, FDV/MC, liquidity, 24h vol, 1h/24h %; basic pair info; project links if available; provider badge.
Done when: updates every 15s; all values match latest cache.

**Prompt for `/src/features/chart/ChartOnlyView.tsx`**
Goal: edge-to-edge chart (not full-screen), header and bottom tabs remain.
Do: render price/volume chart; timeframe selector; marker toggle.
Done when: pinch/drag are smooth; timeframe changes persist in URL/store.

**Prompt for `/src/features/chart/ChartAndTxsView.tsx`**
Goal: vertical split: adjustable chart height + virtualized trades list.
Do: draggable splitter; TX list scroll independent of chart; performance stable.
Done when: drag persists height in session; both panes update live.

**Prompt for `/src/features/chart/TxsOnlyView.tsx`**
Goal: full-width trades table with fixed header; horizontal and vertical scroll.
Do: columns: time, side (magenta/lime), price, amount base/quote, wallet short, link icon; sticky header.
Done when: scrolls smoothly; copy-to-clipboard works; TX explorer link opens new tab.

**Prompt for `/src/features/chart/PoolSwitcher.tsx`**
Goal: top pill bar to swap pools for the same token; hidden in Detail view.
Do: list pools (dex/version, base/quote); switch updates OHLC/trades/KPIs and **keeps x-axis synced**; no page reload.
Done when: switching is <100ms with cached data; x-axis bounds preserved.

**Prompt for `/src/features/chart/PriceChart.tsx`**
Goal: Lightweight-Charts candlestick + volume pane, timeframe control, and buy/sell marker API.
Do: accept `candles`, `volume`, `markers`; expose methods to set data, set visible range, and map timestamps; colors: magenta (sells), lime (buys).
Done when: 2k+ candles at 60fps; markers toggle instantly.

**Prompt for `/src/features/metrics/MetricsPanel.tsx`**
Goal: uPlot mini-charts for optional token metrics (when user enables).
Do: metrics: rolling volume, liquidity, ATR-lite, z-score returns, trade count; compute from cached data on demand; lazy mount.
Done when: enabling a metric doesn’t stutter the main chart; disabling frees memory.

# /src/features/trades

**Prompt for `/src/features/trades/TradesList.tsx`**
Goal: virtualized list of trades with side colors and compact formatting.
Do: live updates from cache; highlight large trades; tap reveals details; pull-to-refresh gesture optional.
Done when: receives deltas and re-renders minimally.

**Prompt for `/src/features/trades/TradeMarkers.ts`**
Goal: transform trades into chart markers on demand.
Do: snap to candle buckets, cluster dense trades per candle; tooltip content (side, size, price, wallet short, tx link).
Done when: clustering reduces >50 markers to a single composite without losing tooltip detail.

# /src/features/lists

**Prompt for `/src/features/lists/ListsPage.tsx`**
Goal: render trending/discovery/leaderboard per chain; window selection (1h/1d/1w).
Do: fetch `/api/lists`; show rank, token, pair, price, liq, vol window, pct change, score; handle `"promoted":true`.
Done when: updates on 60s cadence; sort headers toggle ascending/descending locally.

**Prompt for `/src/features/lists/ListItem.tsx`**
Goal: compact row with quick actions.
Do: tap opens chart; show provider badge; visually separate promoted slots.
Done when: row stays readable at small widths.

# /src/lib

**Prompt for `/src/lib/types.ts`**
Goal: define shared types for tokens, pools, candles, trades, list items, API responses.
Do: include `provider: "gt" | "ds"` where relevant; align timestamps as UNIX seconds; numeric fields as numbers.
Done when: all features import from here; no duplicate type definitions exist.

**Prompt for `/src/lib/api.ts`**
Goal: tiny client fetcher wrappers for `/api/*` with ETag awareness and abort support.
Do: helper `getJson(url, {signal, cacheKey})`; support retry/backoff; return `{data, fromCache, provider}`.
Done when: all features use this; cancellation works on rapid route changes.

**Prompt for `/src/lib/cache.ts`**
Goal: session cache (in-memory + sessionStorage mirror; IndexedDB optional fallback).
Do: get/set/merge for `search`, `pairs`, `ohlc:<pair>:<tf>`, `trades:<pair>`; cap sizes; eviction policy; versioning.
Done when: reload in same tab restores state; memory footprint bounded.

**Prompt for `/src/lib/polling.ts`**
Goal: polling controller with visibility pause/backoff.
Do: `createPoller({fn, interval, onData})`; pause when `document.hidden`; exponential backoff on 429/5xx; jitter to avoid thundering herds.
Done when: multiple pollers coexist without drift.

**Prompt for `/src/lib/time.ts`**
Goal: timeframe helpers and bucketing.
Do: map tf strings to ms; floor timestamps to buckets; compute ranges; update visible range consistently across pool switches.
Done when: switching pools keeps x-axis aligned.

**Prompt for `/src/lib/transforms.ts`**
Goal: pure functions for rollups, z-scores, ATR-lite, spike/trending scores, trade→marker mapping.
Do: all transforms idempotent and unit-testable; defer heavy work to requestIdleCallback or Web Worker hooks.
Done when: outputs match acceptance test vectors.

# /src/styles

**Prompt for `/src/styles/global.css`**
Goal: base resets, typography scale, color tokens.
Do: define CSS vars; prefer system fonts; ensure hit areas ≥44px; scrollbars subtle; table header sticky styles.
Done when: passes quick a11y scan and matches dark spec.

# /netlify/functions (Node serverless)

**Shared prompt for all functions**

* Input validation: reject missing/invalid params (400).
* Upstream: call GeckoTerminal first. On non-200/empty, fall back to Dexscreener.
* Response: normalized JSON; include `provider`.
* Caching: `Cache-Control: public, max-age=30, stale-while-revalidate=60`.
* Errors: return `{"error": "...", "provider":"none"}` with appropriate status.
* Timeouts: 3s per upstream; circuit-break after repeated failures.
* No secrets to client.
* Log rate-limit hits (429) with minimal metadata.

**Prompt for `/netlify/functions/search.ts`**
Goal: address-based cross-chain search with minimal data (no preloading token pages).
Do: accept `query` (address), optional `chain`; return token identity, core finance, and pool summaries.
Done when: result rows render without further calls; provider fallback works.

**Prompt for `/netlify/functions/pairs.ts`**
Goal: enumerate pools for a token.
Do: accept `address`, optional `chain`; return token meta + array of pools (dex/version/base/quote/pairId).
Done when: deep links can populate the pool switcher immediately.

**Prompt for `/netlify/functions/ohlc.ts`**
Goal: OHLCV endpoint normalized by `pairId` and `tf`.
Do: accept `pairId`, `tf`, optional `from/to`; if upstream lacks tf, include `rollupHint: "client"` and provide base-tf data if available.
Done when: chart can render without guessing units; x-axis times are UNIX seconds.

**Prompt for `/netlify/functions/trades.ts`**
Goal: recent trades for a pair.
Do: accept `pairId`, `limit`, `before/after`; return side, price, base/quote sizes, ts, txHash, wallet (if available).
Done when: TXs view and markers can be built solely from this payload.

**Prompt for `/netlify/functions/lists.ts`**
Goal: trending/discovery/leaderboard synthesis from cached public data.
Do: accept `chain`, `type`, `window`, `limit`; compute scores serverless or pass through if provider supplies; include `promoted` flag support via signed admin header (stubbed).
Done when: page loads within \~1s warm cache; sorts stable.

**Prompt for `/netlify/functions/explorer.ts`** (optional)
Goal: proxy to etherscan-style APIs without exposing keys.
Do: accept `chain` + `tx` or `address`; minimal normalized result; strict RPS guard.
Done when: TX linkouts have a verified fallback preview.

# /public

**Prompt for `/public/manifest.json` & icons**
Goal: mobile-friendly PWA-ish meta (even if not fully offline).
Do: name, theme color, icons; disable standalone if not desired.
Done when: iOS Safari displays correct icon and status bar style.

---

## final acceptance criteria (global)

* Lightweight loading: initial route < 80KB JS (after gzip), chart feature chunks lazy.
* Fast address search: first results under 500ms with warm caches; no token preloads.
* Chart page: 4 views functionally correct; pool switching keeps x-axis; header + search pill always visible; bottom tabs persistent.
* Client caching: data stacks during session; polling pauses on background; resumes cleanly.
* Trades markers: computed only on toggle; magenta/lime coloring; clustered tooltips.
* Lists: per-chain trending/discovery/leaderboard render with 60s cache; can display `promoted` items distinctly.
* No WebSockets; all realtime via short polling; provider fallback visible via badge.
* No secrets leaked; all upstream calls routed through functions.
* Styling: black/dark-gray/gray with neon highlights; clean, iOS-inspired; accessible.
