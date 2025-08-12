# Routing

Defines URL structure for the app.

## Routes
- `/` – search page.
- `/t/:chain/:address/:pairId?` – token chart with optional specific pool.
- `/lists/:chain/:type` – token lists (`trending`, `discovery`, `leaderboard`).

## Query Params
- `tf` – timeframe (default `1h`).
- `view` – chart view (`detail`, `chart`, `chart-txs`, `txs`).

## Rules
- Route changes must not trigger full-page reloads.
- Keep pool selection in URL so page can be shared.
