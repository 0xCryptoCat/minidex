# summary

* host: react + vite on netlify (SPA).
* serverless: a few netlify functions (node) for data unification, caching, and provider fallback (no DB).
* data: geckoterminal first; dexscreener fallback. explorer APIs optional.
* charts: price/volume with **Lightweight‑Charts** (option A). **uPlot** for token metrics mini‑charts (option B).
* realtime: **no websockets**; short‑poll from client with backoff + pause on hidden tabs.
* caching: client‑side session cache + incremental stacking while the tab/session is open; CDN and function responses cache for 30–60s.
* UX: search by token **address**; chart page with 4 views; pool switcher pill bar (not on detail view).
* scope: “quick glance” data; heavy history out of scope. monetization flags stubbed, no payments.

# repo skeleton

```
/src
  /app     (routing, shell, theming)
  /components
  /features
    /search
    /chart
    /trades
    /lists
    /pool-switcher
    /metrics
  /lib
    api.ts        (client fetchers)
    cache.ts      (session cache + IndexedDB wrapper)
    polling.ts    (cadence/backoff/visibility control)
    time.ts       (tf, bucketing)
    transforms.ts (markers, rollups, z-scores, etc.)
    types.ts      (shared types)
  /styles
/netlify/functions
  search.ts
  pairs.ts
  ohlc.ts
  trades.ts
  lists.ts
  explorer.ts (optional)
/public
```

# provider strategy

* **primary**: geckoterminal public endpoints for tokens/pairs/OHLC/trades.
* **fallback**: dexscreener for search/pairs/trades when GT fails or is stale.
* rules:

  * each function hits GT; on non‑200 or empty payload → try DS; annotate response `{provider:"gt"|"ds"}`.
  * functions set `Cache-Control: public, max-age=30, stale-while-revalidate=60`.
  * client keeps per‑session cache in memory + sessionStorage (fall back to IndexedDB if needed for larger lists).

# endpoints (netlify functions)

**all responses are compact and normalized across providers. never expose provider keys to client.**

### `GET /api/search?query=<address>&chain?=<slug>`

* purpose: address‑based search; no preloading token pages.
* returns:

```json
{
  "query":"0xabc...",
  "results": [
    {
      "chain":"ethereum",
      "token":{
        "address":"0xabc...",
        "symbol":"ABC",
        "name":"ABC Token",
        "icon":"https://.../abc.png"
      },
      "core":{
        "priceUsd": 0.0123,
        "fdvUsd": 123456,
        "mcUsd": 120000,
        "liqUsd": 45000,
        "vol24hUsd": 89000,
        "priceChange1hPct": -2.1,
        "priceChange24hPct": 15.4
      },
      "pools":[
        {"pairId":"ethereum_univ2_0x..", "dex":"uniswap-v2","version":"v2","base":"ABC","quote":"WETH"},
        {"pairId":"ethereum_univ3_0x..", "dex":"uniswap-v3","version":"v3","base":"ABC","quote":"WETH"}
      ],
      "provider":"gt"
    }
  ]
}
```

### `GET /api/pairs?address=<token>&chain?=<slug>`

* purpose: enumerate pools for a token (if search was skipped or deep‑linked).
* returns: `{ "token":{...}, "pools":[...] , "provider":"gt|ds" }`

### `GET /api/ohlc?pairId=<id>&tf=<1m|5m|15m|1h|4h|1d>&from?<unix>&to?<unix>`

* purpose: candlesticks + volume for selected pool.
* returns:

```json
{
  "pairId":"ethereum_univ2_0x...",
  "tf":"1m",
  "candles":[
    {"t":1719996300,"o":1.01,"h":1.03,"l":1.00,"c":1.02,"v":12345}
  ],
  "provider":"gt"
}
```

* note: if provider lacks the requested tf, function may aggregate lower‑tf data serverless **or** instruct client to roll up (see `rollupHint` field). prefer client rollup.

### `GET /api/trades?pairId=<id>&limit?=100&before?=<unix>&after?=<unix>`

* purpose: recent trades for TX lists and **buy/sell markers**.
* returns:

```json
{
  "pairId":"ethereum_univ2_0x...",
  "trades":[
    {"ts":1720000000,"side":"buy","price":1.021,"amountBase":1200,"amountQuote":1225,"txHash":"0x..","wallet":"0x.."}
  ],
  "provider":"gt"
}
```

### `GET /api/lists?chain=<slug>&type=<trending|discovery|leaderboard>&window?=<1h|1d|1w>&limit?=100`

* purpose: extra pages using only cached public data; promote flags stubbed.
* returns:

```json
{
  "chain":"ethereum",
  "type":"trending",
  "window":"1h",
  "items":[
    {
      "pairId":"ethereum_univ2_0x...",
      "token":{"address":"0x..","symbol":"ABC","name":"ABC"},
      "priceUsd":0.0123,
      "liqUsd":45000,
      "volWindowUsd":22000,
      "priceChangePct":14.2,
      "tradesWindow":321,
      "score":0.78,
      "promoted": false
    }
  ],
  "provider":"gt"
}
```

### `GET /api/explorer?chain=<slug>&tx=<hash>|address=<addr>` (optional)

* purpose: raw explorer lookups without exposing keys (etherscan‑style).
* returns: provider‑normalized minimal fields.

# client caching & polling

* **session cache**: in‑memory map (fast path) mirrored to `sessionStorage` (survives page reload in same tab). keys: `search:<addr>`, `pairs:<addr>:<chain>`, `ohlc:<pair>:<tf>`, `trades:<pair>`.
* **stacking strategy**: when polling, append deltas to cached arrays; trim to N candles/trades per tf to cap memory (e.g., keep last 2k 1m candles).
* **poll cadence**:

  * active pair OHLC: 5s
  * active pair trades: 3s
  * side panels (detail KPIs): 15s
  * lists pages: 60s (or manual refresh)
* **visibility logic**: pause polling when `document.hidden === true`; resume with an immediate fetch.
* **backoff**: on 429/5xx use 10s, 20s, 40s; surface “degraded data” banner.

# navigation & views

* **search page**

  * single input (token address). results show per‑chain rows with icon, name, price, liq, vol, % change, pool count.
  * **no preloading** of token pages on search; only fetch minimal data to show results.
* **chart page** (route: `/t/:chain/:address/:pairId?`)

  * persistent **top header** with menu button + search pill (always visible in every view).
  * **pool switcher pill bar** (between header and content) visible in views 2–4; hidden in view 1 (detail).
  * **four views** (toggle row at bottom):

    1. **Detail**: finance KPIs (price, fdv/mc, liq, 24h vol, 1h/24h pct), basic pair info, optional project links (from provider meta).
    2. **Chart‑only**: edge‑to‑edge chart (not fullscreen), header visible, bottom type switcher visible.
    3. **Chart + TXs**: vertical split; chart height is user‑adjustable; TX list is virtualized.
    4. **TXs‑only**: full‑width virtualized table; fixed header; horizontal scroll for columns.
  * route never reloads the page; switching pools swaps data in place and **keeps x‑axis synced** (anchor on last candle time).

# charting

* **price/volume**: **Lightweight‑Charts**: candlesticks + volume pane.
* **markers (on demand)**: user toggles “trade highlights”; then we compute markers from cached trades:

  * marker shape near candle high/low. side‑coloring: **magenta** for sells, **lime** for buys. tooltip: side, size (base & quote), price, wallet short, tx link.
* **metrics (uPlot)**: small, fast sparklines/panels under main chart (hidden by default; enable per user tap):

  * selectable metrics: rolling vol (base/quote), liquidity, spread (if available), ATR‑lite, z‑score of returns, trade count per interval.
  * keep metrics independent (no database), computed client‑side from existing OHLC/trades; calculated only when toggled.

# pool switcher behavior

* visible in views 2–4 only.
* switching between pools updates OHLC/trades/KPIs with shared x‑axis bounds; maintain zoom/scroll range.
* aggregation of pools **explicitly out of scope** for MVP; keep structure extensible (e.g., `aggregate=false` query reserved).

# data transforms (only when selected)

* **OHLC rollups** (if needed): aggregate 1m → 5m/15m/1h in a Web Worker.
* **trend/spike** scores: compute z‑scores of returns/volume for lists.
* **markers**: snap trade timestamps to candle buckets; cluster multiple fills within the same candle if density is high; hover expands cluster contents.

# lists (trending / discovery / leaderboard)

* **trending** per chain: rank by weighted composite of volΔ, priceΔ, trade count (window selectable).
* **discovery** per chain: newest pools; top movers in 1h/1d/1w.
* **leaderboard** per chain: top market cap, top liquidity.
* pulled via `/api/lists` with 60s cache; items show token+pair basics and quick actions.
* **monetization flags**: items may include `"promoted":true,"promoLabel":"sponsored"`. no payment or countdown logic in MVP.

# styling (minimal, iOS‑inspired)

* dark palette: `#000` / `#0b0b0c` / `#121315` backgrounds, grays for text (`#9aa0a6` to `#e6e6e6`).
* highlights: **lime** (`#a3ff12`) for buys/positive, **magenta** (`#ff2ed1`) for sells/negative, **cyan** for focus rings.
* touch targets ≥ 44px, large tabs/pills, springy transitions kept subtle.

# state & performance

* state: **Zustand** stores per feature; URL is the single source for selected chain/address/pair/view.
* perf: virtualize lists; defer metrics computation until toggled; requestIdleCallback for low‑priority transforms; web worker for rollups/ATR if CPU spikes.
* accessibility: focus order, ARIA labels on tabs/switcher, reduced‑motion support.

# env & config

* netlify env: `GT_API_BASE`, `DS_API_BASE`, optional explorer keys (`ETHERSCAN_KEY`, etc.).
* local `.env.local`: same keys; never expose to client.
* functions guard: only allow whitelisted provider hosts; set strict timeouts and JSON size caps.

# error & empty states

* show provider badge (`gt`/`ds`) and a small “degraded” pill when on fallback or backoff.
* empty search results: “no on‑chain matches; check chain/address.”
* chart failure: skeleton → retry button; never crash the route.

# analytics (lightweight)

* count view switches, pool switches, marker toggles. no PII. send batched beacons.

# acceptance checklist

* search returns cross‑chain rows in <500ms warm cache.
* selecting a result opens chart page without reload; pool switcher behaves as spec.
* 4 views toggle instantly; header + search pill always visible; bottom row tabs always visible.
* markers appear only when toggled and derive from cached trades.
* polling pauses when tab hidden and resumes cleanly.
* lists pages load within 1s warm cache; promote flag renders distinct style.
* no API keys leaked; all provider calls originate from functions.

# tasks for the coder (start → finish)

1. scaffold (vite + react + ts + zustand), routes, theme, shell.
2. implement **/api/search** (GT→DS fallback), then search UI (no preloading).
3. implement **/api/pairs**, deep‑link route parsing, pool switcher store/UX.
4. implement **/api/ohlc** + **/api/trades**; client polling + session cache + visibility pause.
5. build **Lightweight‑Charts** price/volume; view switcher; header & bottom tabs.
6. add trade markers toggle; transform logic; clustered tooltips; link to explorer.
7. add **uPlot** metrics panels (lazy‑mount, toggled).
8. build **detail view** KPIs + project links (if provided).
9. build **lists** + **/api/lists**; ranking functions; promoted flag styling.
10. performance pass (virtualization, workers, backoff) + error/empty states.
11. smoke tests (throttle network, pause visibility, force fallback, overflow cases).
12. deploy to netlify; wire env secrets; set CDN headers in functions.

---
