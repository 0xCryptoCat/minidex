// Smoke tests for backend endpoints
// Run: npx ts-node scripts/smoke.ts

const BASE = process.env.BASE_URL || 'http://localhost:8888/.netlify/functions';
const ADDRESS = '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC

function u(path: string) {
  return `${BASE}${path}`;
}

async function main() {
  const table: { endpoint: string; provider: string | null; items: string | null }[] = [];

  // locate pools
  const searchRes = await fetch(u(`/search?query=${ADDRESS}`));
  const searchData = await searchRes.json();
  const pool = searchData.results?.[0]?.pools?.find((p: any) => p.poolAddress && p.gtSupported);
  if (!pool) throw new Error('search: no supported pool with poolAddress');
  const poolAddress = pool.poolAddress as string;
  table.push({ endpoint: 'search', provider: searchRes.headers.get('x-provider'), items: searchRes.headers.get('x-items') });

  const pairsRes = await fetch(u(`/pairs?chain=ethereum&address=${ADDRESS}`));
  const pairsData = await pairsRes.json();
  const found = pairsData.pools?.some((p: any) => p.poolAddress === poolAddress && p.gtSupported);
  if (!found) throw new Error('pairs: poolAddress or gtSupported missing');
  const unsupported = pairsData.pools?.find((p: any) => p.poolAddress && p.gtSupported === false);
  if (!unsupported) throw new Error('pairs: no gtUnsupported pool found');
  table.push({ endpoint: 'pairs', provider: pairsRes.headers.get('x-provider'), items: pairsRes.headers.get('x-items') });

  const pairId = pool.pairId as string;
  const pairIdU = unsupported.pairId as string;
  const poolAddressU = unsupported.poolAddress as string;

  // Case A: GT-supported
  const ohlcResA = await fetch(u(`/ohlc?pairId=${pairId}&chain=ethereum&poolAddress=${poolAddress}&tf=1m`));
  const ohlcDataA = await ohlcResA.json();
  if (!Array.isArray(ohlcDataA.candles) || ohlcDataA.candles.length === 0) {
    throw new Error('caseA: ohlc empty');
  }
  for (let i = 1; i < ohlcDataA.candles.length; i++) {
    if (ohlcDataA.candles[i - 1].t >= ohlcDataA.candles[i].t) {
      throw new Error('caseA: candles not ascending');
    }
  }
  table.push({ endpoint: 'ohlcA', provider: ohlcResA.headers.get('x-provider'), items: ohlcResA.headers.get('x-items') });

  const tradesResA = await fetch(u(`/trades?pairId=${pairId}&chain=ethereum&poolAddress=${poolAddress}`));
  const tradesDataA = await tradesResA.json();
  const countA = Array.isArray(tradesDataA.trades) ? tradesDataA.trades.length : 0;
  if (countA < 1) throw new Error('caseA: no trades');
  table.push({ endpoint: 'tradesA', provider: tradesResA.headers.get('x-provider'), items: tradesResA.headers.get('x-items') });

  // Case B: GT-unsupported but CG-covered
  const ohlcResB = await fetch(u(`/ohlc?pairId=${pairIdU}&chain=ethereum&poolAddress=${poolAddressU}&tf=1m`));
  const ohlcDataB = await ohlcResB.json();
  const candlesB = Array.isArray(ohlcDataB.candles) ? ohlcDataB.candles.length : 0;
  if (candlesB === 0 && ohlcResB.headers.get('x-provider') !== 'synthetic') {
    throw new Error('caseB: ohlc missing data and not synthetic');
  }
  const tradesResB = await fetch(u(`/trades?pairId=${pairIdU}&chain=ethereum&poolAddress=${poolAddressU}`));
  const tradesDataB = await tradesResB.json();
  const tradesB = Array.isArray(tradesDataB.trades) ? tradesDataB.trades.length : 0;
  if (tradesB === 0 && tradesResB.headers.get('x-provider') !== 'synthetic') {
    throw new Error('caseB: trades missing data and not synthetic');
  }
  if (candlesB === 0 && tradesB === 0) {
    throw new Error('caseB: no cg data');
  }
  table.push({ endpoint: 'ohlcB', provider: ohlcResB.headers.get('x-provider'), items: ohlcResB.headers.get('x-items') });
  table.push({ endpoint: 'tradesB', provider: tradesResB.headers.get('x-provider'), items: tradesResB.headers.get('x-items') });

  // Case C: unsupported network
  const unsRes = await fetch(u(`/ohlc?pairId=${pairId}&chain=amoy&poolAddress=${poolAddress}&tf=1m`));
  const unsData = await unsRes.json();
  if (unsRes.status !== 200) throw new Error('caseC: non-200');
  if (unsData.error !== 'unsupported_network') throw new Error('caseC: wrong error');
  if (unsRes.headers.get('x-provider') !== 'none') throw new Error('caseC: provider header not none');
  table.push({ endpoint: 'ohlc_unsupported', provider: unsRes.headers.get('x-provider'), items: unsRes.headers.get('x-items') });

  console.table(table);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
