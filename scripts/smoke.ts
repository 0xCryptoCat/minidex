// Smoke tests for backend endpoints
// Run: npx ts-node scripts/smoke.ts

const BASE = process.env.BASE_URL || 'http://localhost:8888/.netlify/functions';
const ADDRESS = '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC

function u(path: string) {
  return `${BASE}${path}`;
}

async function main() {
  const table: { endpoint: string; provider: string | null; items: string | null }[] = [];

  // search
  const searchRes = await fetch(u(`/search?query=${ADDRESS}`));
  const searchData = await searchRes.json();
  const pool = searchData.results?.[0]?.pools?.find((p: any) => p.poolAddress);
  if (!pool) throw new Error('search: no pool with poolAddress');
  const poolAddress = pool.poolAddress as string;
  table.push({ endpoint: 'search', provider: searchRes.headers.get('x-provider'), items: searchRes.headers.get('x-items') });

  // pairs
  const pairsRes = await fetch(u(`/pairs?chain=ethereum&address=${ADDRESS}`));
  const pairsData = await pairsRes.json();
  const found = pairsData.pools?.some((p: any) => p.poolAddress === poolAddress && p.gtSupported);
  if (!found) throw new Error('pairs: poolAddress or gtSupported missing');
  table.push({ endpoint: 'pairs', provider: pairsRes.headers.get('x-provider'), items: pairsRes.headers.get('x-items') });

  const pairId = pool.pairId as string;

  // ohlc
  const ohlcRes = await fetch(u(`/ohlc?pairId=${pairId}&chain=ethereum&poolAddress=${poolAddress}&tf=1m`));
  const ohlcData = await ohlcRes.json();
  const eff = ohlcRes.headers.get('x-effective-tf');
  if (!(Array.isArray(ohlcData.candles) && ohlcData.candles.length > 0) && !eff) {
    throw new Error('ohlc: empty response');
  }
  table.push({ endpoint: 'ohlc', provider: ohlcRes.headers.get('x-provider'), items: ohlcRes.headers.get('x-items') });

  // trades
  const tradesRes = await fetch(u(`/trades?pairId=${pairId}&chain=ethereum&poolAddress=${poolAddress}`));
  const tradesData = await tradesRes.json();
  const count = Array.isArray(tradesData.trades) ? tradesData.trades.length : 0;
  if (count < 0 || count > 300) throw new Error('trades: count out of range');
  table.push({ endpoint: 'trades', provider: tradesRes.headers.get('x-provider'), items: tradesRes.headers.get('x-items') });

  // token
  const tokenRes = await fetch(u(`/token?chain=ethereum&address=${ADDRESS}`));
  const tokenData = await tokenRes.json();
  const links = tokenData.links ? Object.values(tokenData.links).filter(Boolean) : [];
  if (links.length < 1) throw new Error('token: no links');
  table.push({ endpoint: 'token', provider: tokenRes.headers.get('x-provider'), items: tokenRes.headers.get('x-items') });

  console.table(table);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
