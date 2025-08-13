# PREPARATION PACK — Build-Ready Checklist

> Goal: eliminate guesswork. Everything here is **inputs** (fixtures, specs, copy, constants) that the codebase consumes.

---

## 0) Quick Index

* [Project Factsheet](#1-project-factsheet)
* [API Contracts](#2-api-contracts)
* [Provider Mappings](#3-provider-mappings)
* [JSON Fixtures](#4-json-fixtures)
* [Polling & Caching Policy](#5-polling--caching-policy)
* [Timeframes & Bucketing Rules](#6-timeframes--bucketing-rules)
* [Chart UX Spec (Markers & Metrics)](#7-chart-ux-spec-markers--metrics)
* [Chains Registry](#8-chains-registry)
* [Environment & Secrets](#9-environment--secrets)
* [Error & Empty States Copy](#10-error--empty-states-copy)
* [Telemetry Plan](#11-telemetry-plan)
* [Accessibility Checklist](#12-accessibility-checklist)
* [Design Tokens & Visual Spec](#13-design-tokens--visual-spec)
* [Routing & URL Contract](#14-routing--url-contract)
* [Acceptance Test Vectors](#15-acceptance-test-vectors)
* [Performance Budgets](#16-performance-budgets)
* [Security & Abuse Guardrails](#17-security--abuse-guardrails)
* [Release & Deployment Notes](#18-release--deployment-notes)
* [Operational Playbook](#19-operational-playbook)
* [Open Questions & V2 Hooks](#20-open-questions--v2-hooks)

---

## 1) Project Factsheet

**File:** `/docs/FACTSHEET.md`
**Purpose:** 1-page alignment: what we’re building, out-of-scope, success criteria.

* Elevator pitch, audience, platforms (Telegram WebApp + mobile web).
* MVP scope: quick-glance charts, trades, pools; **no heavy history**, **no payments**.
* Non-goals (e.g., alerts, watchlists, auth).
* Success metrics: TTI, search latency, chart FPS, error rate.

---

## 2) API Contracts

**File:** `/docs/api-contracts.md`
**Purpose:** Final shape of each **Netlify Function** request/response and error envelope.

* Endpoints: `/api/search`, `/api/pairs`, `/api/ohlc`, `/api/trades`, `/api/lists`, `/api/explorer` (optional).
* Params (name, type, required/optional, validation).
* Response schemas (link to `/src/lib/types.ts`).
* Errors: `400`, `408`, `429`, `502/503/504` — messages and client behavior.
* Headers: `Cache-Control: public, max-age=30, stale-while-revalidate=60`.
* Rate-limit behavior and backoff expectations.

---

## 3) Provider Mappings

**File:** `/docs/providers.md`
**Purpose:** Field-by-field map from **GeckoTerminal** and **Dexscreener** to normalized types.

* For **Search**: token identity, icon rules, FDV/MC/liquidity/vol sources, % change window.
* For **Pairs**: stable `pairId` rules and DEX/version normalization.
* For **OHLC**: tf availability per provider; base vs quote volumes; USD derivations.
* For **Trades**: side detection, price derivation, wallet/tx availability.
* Lists: which metrics come native vs computed.
* Notes on missing data & sane defaults.

---

## 4) JSON Fixtures

**Folder:** `/fixtures`
**Purpose:** Develop UI offline and pin normalizers.

* `search-gt.json`, `search-ds.json`
* `pairs-gt.json`
* `ohlc-gt-1m.json`, `ohlc-ds-1m.json`
* `trades-gt.json`, `trades-ds.json`
* `lists-trending-eth-1h.json`, `lists-discovery-eth-1d.json`, `lists-leaderboard-eth-1d.json`
* One **token with multiple pools** fixture (v2 & v3) for switcher testing.
* Include **edge cases**: no icon, zero liquidity, sparse OHLC, burst trades.

Each file should have a short README note (top comment) describing what it tests.

---

## 5) Polling & Caching Policy

**File:** `/docs/polling.md`
**Purpose:** Precise cadence & pause/resume semantics.

* Cadence: OHLC 5s, Trades 3s, KPIs 15s, Lists 60s.
* Pause when `document.hidden`; resume with immediate fetch.
* Backoff ladder on `429/5xx`: 10s → 20s → 40s; show “degraded data” banner.
* Client session cache strategy (key patterns, eviction, max entries).
* CDN/function cache alignment with provider caching realities.

---

## 6) Timeframes & Bucketing Rules

**File:** `/docs/timeframes.md`
**Purpose:** Single source of truth for TF math.

* TF → seconds mapping (`1m`, `5m`, `15m`, `1h`, `4h`, `1d`).
* Bucket floor/ceil rules; visible range preservation across pool switch.
* Rollups: when to roll up client-side (and window sizes).
* Max candles per TF to cap memory.

---

## 7) Chart UX Spec (Markers & Metrics)

**File:** `/docs/chart-ux.md`
**Purpose:** Micro-interactions & formulas so UI looks “intentional.”

* **Markers:** toggle behavior, clustering threshold, tooltip fields, colors (lime buy, magenta sell), z-index rules.
* **Metrics (uPlot):** definitions, windows (e.g., ATR-lite N, z-score window), compute-on-demand only.
* Performance guardrails: max markers on screen; when to offload to Worker; idle scheduling.

---

## 8) Chains Registry

**File:** `/src/lib/chains.json`
**Purpose:** Consistent chain display & explorer links.

* `slug`, `name`, `icon?`, `nativeSymbol`, `explorerTx`, `explorerAddress`.
* (Optional) `usdPriceSource` if needed later.

---

## 9) Environment & Secrets

**Files:** `.env.local.example`, `/docs/deploy.md`
**Purpose:** Clear env contract and deploy repeatability.

* Keys: `GT_API_BASE`, `DS_API_BASE`, optional `ETHERSCAN_KEY`.
* CoinGecko: `COINGECKO_API_BASE`, `COINGECKO_API_KEY` — Pro on-chain API (10K calls/mo, 30 req/min). Endpoints consumed: `token-data`, `tokens-data`, `pool-ohlcv`, `pool-trades`, `trending`. Handle `400`/`401`/`429` codes with graceful fallback.
* Local vs Netlify env guidance.
* Never expose secrets client-side; all calls through functions.

---

## 10) Error & Empty States Copy

**File:** `/src/copy/en.json`
**Purpose:** Centralized user messages.

* Search: “No results”, invalid address.
* Fallback: “Provider degraded — showing fallback data.”
* Rate limit: “Temporarily rate-limited. Retrying…”
* Network: “Your network seems offline.”
* Lists empty, Trades empty, Chart data sparse.

Each message <= 80 chars where possible.

---

## 11) Telemetry Plan

**File:** `/docs/telemetry.md`
**Purpose:** Minimal, privacy-friendly analytics.

* Events: `search_submit`, `result_click`, `view_switch`, `pool_switch`, `markers_toggle`, `metrics_toggle`.
* Properties per event (e.g., chain, tf, pool count).
* Transport: `navigator.sendBeacon` batching.
* No PII; include a random session id only.

---

## 12) Accessibility Checklist

**File:** `/docs/a11y.md`
**Purpose:** Bake accessibility into definition of done.

* 44px touch targets, focus outlines, ARIA for tabs/segmented controls.
* Reduced motion media query supported.
* Color contrast (AA) for text and critical UI.
* Keyboard nav path for all interactive elements.

---

## 13) Design Tokens & Visual Spec

**Files:** `/src/styles/global.css`, `/docs/theme.md`
**Purpose:** Stable dark theme, neon accents.

* Tokens: background tiers, surfaces, text tiers, borders, focus, success (lime), danger (magenta), info (cyan).
* Examples: headers, pills, badges, table header sticky style.
* Motion: durations/easings; subtle only.

---

## 14) Routing & URL Contract

**File:** `/docs/routing.md`
**Purpose:** Deep-linking clarity.

* `/` → search
* `/t/:chain/:address/:pairId?` → chart page
* `/lists/:chain/:type` → lists (type ∈ trending|discovery|leaderboard)
* Query params: `tf`, `view`, pool selection rules.
* Never reload full page on route change.

---

## 15) Acceptance Test Vectors

**Folder:** `/tests/vectors`
**Purpose:** Deterministic inputs for manual & automated checks.

* Scripts or markdown listing:

  * Multiple pools scenario.
  * High-frequency trades (marker clustering check).
  * Sparse OHLC (rollup hint exercised).
  * Provider fallback (GT down → DS path).
  * Lists ranking determinism.
* Each vector maps to expected UI outcomes.

---

## 16) Performance Budgets

**File:** `/docs/perf.md`
**Purpose:** Hard limits to guard the MVP.

* JS initial ≤ **80 KB** gz (route shell).
* Time to interactive (TTI) ≤ **1.5s** on mid-tier mobile (warm).
* Chart render ≥ **60 FPS** with 2k candles + markers.
* Search result paint ≤ **500 ms** with warm cache.
* Memory cap for caches (numbers per TF, trades).

---

## 17) Security & Abuse Guardrails

**File:** `/docs/security.md`
**Purpose:** Prevent obvious abuse, key leaks, and quota burn.

* Functions: strict input validation; origin whitelist; 3s upstream timeouts; response size caps.
* Rate limiting & circuit breakers (temporary denylist on repeated offenses).
* No secrets in client bundle; verify envs at build.
* Sanitization for user inputs (addresses, chain slugs).

---

## 18) Release & Deployment Notes

**File:** `/docs/deploy.md`
**Purpose:** One-click reproducible deploy.

* Netlify config (build command, publish dir).
* Env var names and expected values.
* Post-deploy smoke checks (functions up, cache headers, route health).
* Rollback plan.

---

## 19) Operational Playbook

**File:** `/docs/ops.md`
**Purpose:** What to do when things go sideways.

* Incident checklist (provider outage, 429 storms).
* Toggling features (e.g., disable lists temporarily).
* Updating chains registry without redeploy.
* Known provider quirks and workarounds.

---

## 20) Open Questions & V2 Hooks

**File:** `/docs/v2-hooks.md`
**Purpose:** Keep momentum without derailing MVP.

* Pool aggregation (out of scope now): data model & UI sketch.
* True realtime via WS (3rd-party relay) vs polling.
* Monetization: promoted slots governance (payments, time windows).
* Watchlists/alerts, offline caching, more fiat currencies.

---

## Deliverables Table

| Artifact          | Path                     | Owner     | Ready When                        |
| ----------------- | ------------------------ | --------- | --------------------------------- |
| Factsheet         | `/docs/FACTSHEET.md`     | PM        | Scope & success metrics agreed    |
| API Contracts     | `/docs/api-contracts.md` | BE        | Params, shapes, errors locked     |
| Provider Mappings | `/docs/providers.md`     | BE        | Field maps & derivations listed   |
| Fixtures          | `/fixtures/*`            | QA        | Cover normal + edge cases         |
| Polling Policy    | `/docs/polling.md`       | FE        | Cadence/backoff implemented       |
| Timeframes        | `/docs/timeframes.md`    | FE        | Bucket math shared                |
| Chart UX          | `/docs/chart-ux.md`      | FE/Design | Markers/metrics behavior fixed    |
| Chains Registry   | `/src/lib/chains.json`   | FE        | Core chains included              |
| Env Templates     | `.env.local.example`     | DevOps    | Keys explained; no secrets in git |
| Copy              | `/src/copy/en.json`      | Content   | Strings reviewed                  |
| Telemetry         | `/docs/telemetry.md`     | FE        | Events list finalized             |
| A11y              | `/docs/a11y.md`          | QA        | WCAG AA checklist compiled        |
| Theme             | `/docs/theme.md`         | Design    | Tokens & usage documented         |
| Routing           | `/docs/routing.md`       | FE        | Deep links tested                 |
| Test Vectors      | `/tests/vectors/*`       | QA        | Scenarios reproducible            |
| Perf Budgets      | `/docs/perf.md`          | Eng       | Budgets agreed                    |
| Security          | `/docs/security.md`      | Eng       | Input/timeout/circuit rules set   |
| Deploy            | `/docs/deploy.md`        | DevOps    | Netlify steps clear               |
| Ops               | `/docs/ops.md`           | PM/DevOps | Incident runbook written          |
| V2 Hooks          | `/docs/v2-hooks.md`      | PM        | Future scope captured             |

---

## Prep Sequence (Recommended)

1. **Factsheet → API Contracts → Provider Mappings** (locks interfaces)
2. **Timeframes, Polling, Chart UX** (locks behavior)
3. **Chains Registry, Theme, Copy** (locks look/feel)
4. **Fixtures & Test Vectors** (unblocks FE offline)
5. **Security, Perf Budgets, Deploy** (keeps MVP tight)
6. **Telemetry, Ops, V2 Hooks** (post-MVP continuity)

---
