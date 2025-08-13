# Deployment Notes

## Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `/netlify/functions`
- SPA fallback: `_redirects` with `/* /index.html 200`
- Set env vars in project settings: `GT_API_BASE`, `DS_API_BASE`, `COINGECKO_API_BASE`, `COINGECKO_API_KEY`, optional `ETHERSCAN_KEY`
- CoinGecko Pro key: 10K calls/month, 30 req/min (pass via `x-cg-pro-api-key` header or `x_cg_pro_api_key` query)
- Copy bundle sizes from build logs after deploy

## Smoke Checks
1. Functions respond at `/.netlify/functions/*` with cache headers.
2. Search for known token and open chart.
3. Switch pools without page reload.
4. Toggle trade markers and metrics panel.
5. Visit lists page and verify provider badges.
6. Deep links work via SPA redirect.
7. Force DS provider (`?provider=ds`) to simulate GT outage and see backoff banner.
