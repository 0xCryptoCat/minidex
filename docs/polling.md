# Polling & Caching Policy

## Cadence
- OHLC: every 5s when chart visible.
- Trades: every 3s when trades view active.
- Detail KPIs: every 15s.
- Lists: every 60s.

## Pause & Resume
- Suspend polling when `document.hidden`.
- Resume with immediate fetch when tab becomes visible.

## Backoff
- On HTTP `429` or `5xx`, use exponential backoff: 10s → 20s → 40s.
- Show "degraded" banner during backoff periods.

## Client Cache
- In-memory plus `sessionStorage` mirror.
- Evict oldest entries when cache grows beyond limits.

## CDN & Function Cache
- Functions respond with `Cache-Control: public, max-age=30, stale-while-revalidate=60`.
- Aligns with provider caching where possible.
