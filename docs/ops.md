# Operational Playbook

## Incidents
- If provider outage, automatically fallback to secondary provider. Monitor error rates.
- If rate limits triggered, increase backoff durations and display degraded banner.

## Feature Toggles
- Lists endpoint can be disabled by returning empty array.
- Metrics panel and markers may be feature-flagged in client store.

## Updates
- Chains registry (`src/lib/chains.json`) can be extended without redeploying functions.
