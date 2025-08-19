.
├── data
│   ├── gt-networks-dexes.json
│   └── network-summary.json
├── DEV.README
├── docs
│   ├── a11y.md
│   ├── api-contracts.md
│   ├── chart-ux.md
│   ├── deploy.md
│   ├── FACTSHEET.md
│   ├── goplus.md
│   ├── gt_dexes.md
│   ├── gt_networks.md
│   ├── honeypotis.md
│   ├── ops.md
│   ├── perf.md
│   ├── PLAN.md
│   ├── polling.md
│   ├── POOL_DATA_AUDIT.md
│   ├── PREPARATION.md
│   ├── providers.md
│   ├── routing.md
│   ├── security.md
│   ├── telemetry.md
│   ├── theme.md
│   ├── timeframes.md
│   ├── TODO.md
│   └── v2-hooks.md
├── extracted-icons-debug.json
├── fixtures
│   ├── lists-discovery-eth-1d.json
│   ├── lists-leaderboard-eth-1d.json
│   ├── lists-trending-eth-1h.json
│   ├── ohlc-ds-1m.json
│   ├── ohlc-gt-1m.json
│   ├── pairs-gt.json
│   ├── search-ds.json
│   ├── search-gt.json
│   ├── trades-ds.json
│   └── trades-gt.json
├── index.html
├── netlify
│   ├── functions
│   │   ├── lists.ts
│   │   ├── ohlc.ts
│   │   ├── pairs.ts
│   │   ├── search.ts
│   │   ├── token.ts
│   │   └── trades.ts
│   └── shared
│       ├── agg.ts
│       ├── chains.ts
│       ├── dex-allow.ts
│       └── http.ts
├── netlify.toml
├── package-lock.json
├── package.json
├── public
│   ├── _redirects
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── logo_animation.json
│   ├── logo_w.svg
│   ├── logo.svg
│   └── manifest.json
├── repo-structure.txt
├── scripts
│   ├── extract-icons.js
│   ├── fetch-gt-data.ts
│   ├── smoke.ts
│   ├── test-integration.ts
│   └── update-configs.ts
├── src
│   ├── app
│   │   ├── index.tsx
│   │   └── routes.tsx
│   ├── components
│   │   ├── BottomTabs.tsx
│   │   ├── ChartLoader.tsx
│   │   ├── CopyButton.tsx
│   │   ├── Header.tsx
│   │   └── VirtualList.tsx
│   ├── copy
│   │   └── en.json
│   ├── features
│   │   ├── chart
│   │   │   ├── ChartOnlyView.tsx
│   │   │   ├── ChartPage.tsx
│   │   │   ├── DetailTop.tsx
│   │   │   ├── DetailView.tsx
│   │   │   ├── PoolSwitcher.tsx
│   │   │   ├── PriceChart.tsx
│   │   │   └── TimeframeSelector.tsx
│   │   ├── lists
│   │   │   ├── ListItem.tsx
│   │   │   └── ListsPage.tsx
│   │   ├── metrics
│   │   │   └── MetricsPanel.tsx
│   │   ├── search
│   │   │   ├── SearchInput.tsx
│   │   │   ├── SearchPage.tsx
│   │   │   └── SearchResultItem.tsx
│   │   └── trades
│   │       ├── TradeMarkers.ts
│   │       └── TradesOnlyView.tsx
│   ├── lib
│   │   ├── api.ts
│   │   ├── cache.ts
│   │   ├── chain-icons.ts
│   │   ├── chains.json
│   │   ├── chains.ts
│   │   ├── explorer.ts
│   │   ├── format.tsx
│   │   ├── icons-data.json
│   │   ├── icons.ts
│   │   ├── pairs.ts
│   │   ├── polling.ts
│   │   ├── pool-manager.ts
│   │   ├── provider.tsx
│   │   ├── tf-cache.ts
│   │   ├── time.ts
│   │   ├── timeframes.ts
│   │   ├── transforms.ts
│   │   └── types.ts
│   ├── main.tsx
│   ├── pages
│   │   ├── Chart.tsx
│   │   ├── Home.tsx
│   │   └── Lists.tsx
│   └── styles
│       ├── detail 2.css
│       ├── detail.css
│       ├── global.css
│       ├── search.css
│       ├── theme.css
│       ├── tooltips.css
│       ├── trades 2.css
│       └── trades.css
├── tests
│   └── vectors
│       └── README.md
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

24 directories, 121 files

---

Here’s your repo map with **clickable raw links** (branch: `main`). I grouped by top-level folder to keep it readable.

---

### Root

* [DEV.README](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/DEV.README)
* [extracted-icons-debug.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/extracted-icons-debug.json)
* [index.html](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/index.html)
* [netlify.toml](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/netlify.toml)
* [package-lock.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/package-lock.json)
* [package.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/package.json)
* [repo-structure.txt](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/repo-structure.txt)
* [tsconfig.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/tsconfig.json)
* [tsconfig.node.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/tsconfig.node.json)
* [vite.config.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/vite.config.ts)

---

### data

* [data/gt-networks-dexes.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/data/gt-networks-dexes.json)
* [data/network-summary.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/data/network-summary.json)

---

### docs

* [docs/a11y.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/a11y.md)
* [docs/api-contracts.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/api-contracts.md)
* [docs/chart-ux.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/chart-ux.md)
* [docs/deploy.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/deploy.md)
* [docs/FACTSHEET.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/FACTSHEET.md)
* [docs/goplus.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/goplus.md)
* [docs/gt\_dexes.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/gt_dexes.md)
* [docs/gt\_networks.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/gt_networks.md)
* [docs/honeypotis.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/honeypotis.md)
* [docs/ops.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/ops.md)
* [docs/perf.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/perf.md)
* [docs/PLAN.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/PLAN.md)
* [docs/polling.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/polling.md)
* [docs/POOL\_DATA\_AUDIT.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/POOL_DATA_AUDIT.md)
* [docs/PREPARATION.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/PREPARATION.md)
* [docs/providers.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/providers.md)
* [docs/routing.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/routing.md)
* [docs/security.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/security.md)
* [docs/telemetry.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/telemetry.md)
* [docs/theme.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/theme.md)
* [docs/timeframes.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/timeframes.md)
* [docs/TODO.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/TODO.md)
* [docs/v2-hooks.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/docs/v2-hooks.md)

---

### fixtures

* [fixtures/lists-discovery-eth-1d.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/fixtures/lists-discovery-eth-1d.json)
* [fixtures/lists-leaderboard-eth-1d.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/fixtures/lists-leaderboard-eth-1d.json)
* [fixtures/lists-trending-eth-1h.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/fixtures/lists-trending-eth-1h.json)
* [fixtures/ohlc-ds-1m.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/fixtures/ohlc-ds-1m.json)
* [fixtures/ohlc-gt-1m.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/fixtures/ohlc-gt-1m.json)
* [fixtures/pairs-gt.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/fixtures/pairs-gt.json)
* [fixtures/search-ds.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/fixtures/search-ds.json)
* [fixtures/search-gt.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/fixtures/search-gt.json)
* [fixtures/trades-ds.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/fixtures/trades-ds.json)
* [fixtures/trades-gt.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/fixtures/trades-gt.json)

---

### netlify/functions

* [netlify/functions/lists.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/netlify/functions/lists.ts)
* [netlify/functions/ohlc.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/netlify/functions/ohlc.ts)
* [netlify/functions/pairs.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/netlify/functions/pairs.ts)
* [netlify/functions/search.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/netlify/functions/search.ts)
* [netlify/functions/token.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/netlify/functions/token.ts)
* [netlify/functions/trades.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/netlify/functions/trades.ts)

### netlify/shared

* [netlify/shared/agg.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/netlify/shared/agg.ts)
* [netlify/shared/chains.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/netlify/shared/chains.ts)
* [netlify/shared/dex-allow.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/netlify/shared/dex-allow.ts)
* [netlify/shared/http.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/netlify/shared/http.ts)

---

### public

* [public/\_redirects](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/public/_redirects)
* [public/icon-192.png](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/public/icon-192.png)
* [public/icon-512.png](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/public/icon-512.png)
* [public/logo\_animation.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/public/logo_animation.json)
* [public/logo\_w.svg](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/public/logo_w.svg)
* [public/logo.svg](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/public/logo.svg)
* [public/manifest.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/public/manifest.json)

---

### scripts

* [scripts/extract-icons.js](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/scripts/extract-icons.js)
* [scripts/fetch-gt-data.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/scripts/fetch-gt-data.ts)
* [scripts/smoke.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/scripts/smoke.ts)
* [scripts/test-integration.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/scripts/test-integration.ts)
* [scripts/update-configs.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/scripts/update-configs.ts)

---

### src/app

* [src/app/index.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/app/index.tsx)
* [src/app/routes.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/app/routes.tsx)

### src/components

* [src/components/BottomTabs.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/components/BottomTabs.tsx)
* [src/components/ChartLoader.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/components/ChartLoader.tsx)
* [src/components/CopyButton.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/components/CopyButton.tsx)
* [src/components/Header.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/components/Header.tsx)
* [src/components/VirtualList.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/components/VirtualList.tsx)

### src/copy

* [src/copy/en.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/copy/en.json)

### src/features/chart

* [src/features/chart/ChartOnlyView.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/chart/ChartOnlyView.tsx)
* [src/features/chart/ChartPage.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/chart/ChartPage.tsx)
* [src/features/chart/DetailTop.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/chart/DetailTop.tsx)
* [src/features/chart/DetailView.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/chart/DetailView.tsx)
* [src/features/chart/PoolSwitcher.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/chart/PoolSwitcher.tsx)
* [src/features/chart/PriceChart.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/chart/PriceChart.tsx)
* [src/features/chart/TimeframeSelector.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/chart/TimeframeSelector.tsx)

### src/features/lists

* [src/features/lists/ListItem.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/lists/ListItem.tsx)
* [src/features/lists/ListsPage.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/lists/ListsPage.tsx)

### src/features/metrics

* [src/features/metrics/MetricsPanel.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/metrics/MetricsPanel.tsx)

### src/features/search

* [src/features/search/SearchInput.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/search/SearchInput.tsx)
* [src/features/search/SearchPage.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/search/SearchPage.tsx)
* [src/features/search/SearchResultItem.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/search/SearchResultItem.tsx)

### src/features/trades

* [src/features/trades/TradeMarkers.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/trades/TradeMarkers.ts)
* [src/features/trades/TradesOnlyView.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/features/trades/TradesOnlyView.tsx)

### src/lib

* [src/lib/api.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/api.ts)
* [src/lib/cache.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/cache.ts)
* [src/lib/chain-icons.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/chain-icons.ts)
* [src/lib/chains.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/chains.json)
* [src/lib/chains.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/chains.ts)
* [src/lib/explorer.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/explorer.ts)
* [src/lib/format.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/format.tsx)
* [src/lib/icons-data.json](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/icons-data.json)
* [src/lib/icons.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/icons.ts)
* [src/lib/pairs.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/pairs.ts)
* [src/lib/polling.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/polling.ts)
* [src/lib/pool-manager.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/pool-manager.ts)
* [src/lib/provider.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/provider.tsx)
* [src/lib/tf-cache.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/tf-cache.ts)
* [src/lib/time.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/time.ts)
* [src/lib/timeframes.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/timeframes.ts)
* [src/lib/transforms.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/transforms.ts)
* [src/lib/types.ts](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/lib/types.ts)

### src/pages

* [src/pages/Chart.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/pages/Chart.tsx)
* [src/pages/Home.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/pages/Home.tsx)
* [src/pages/Lists.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/pages/Lists.tsx)

### src/styles

* [src/styles/detail%202.css](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/styles/detail%202.css)
* [src/styles/detail.css](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/styles/detail.css)
* [src/styles/global.css](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/styles/global.css)
* [src/styles/search.css](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/styles/search.css)
* [src/styles/theme.css](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/styles/theme.css)
* [src/styles/tooltips.css](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/styles/tooltips.css)
* [src/styles/trades%202.css](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/styles/trades%202.css)
* [src/styles/trades.css](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/styles/trades.css)

### src root

* [src/main.tsx](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/src/main.tsx)

---

### tests/vectors

* [tests/vectors/README.md](https://raw.githubusercontent.com/0xCryptoCat/minidex/main/tests/vectors/README.md)

---