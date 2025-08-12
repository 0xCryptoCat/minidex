# Timeframes & Bucketing

Defines supported candle intervals and bucket rules.

| Timeframe | Seconds |
|-----------|---------|
| `1m`      | 60      |
| `5m`      | 300     |
| `15m`     | 900     |
| `1h`      | 3600    |
| `4h`      | 14400   |
| `1d`      | 86400   |

## Bucket Rules
- Provider may not supply all timeframes; roll up smaller candles client-side when needed.
- Preserve visible range when switching pools.
- Limit stored candles per timeframe to prevent memory bloat.
