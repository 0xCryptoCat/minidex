# Deployment Notes

## Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `/netlify/functions`
- Configure environment variables: `GT_API_BASE`, `DS_API_BASE`, optional `ETHERSCAN_KEY`.

## Smoke Checks
1. Search for known token and open chart.
2. Switch pools without page reload.
3. Toggle trade markers and metrics panel.
4. Visit lists page and verify items.
5. Confirm all responses include cache headers.
