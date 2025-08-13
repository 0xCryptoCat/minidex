import { useEffect, useState } from 'react';
import type { CoreFinance, PoolSummary, TokenMeta, Provider } from '../../lib/types';
import { search, pairs } from '../../lib/api';
import { getSearchCache, getPairsCache } from '../../lib/cache';
import { createPoller } from '../../lib/polling';

interface Props {
  chain: string;
  address: string;
  pairId: string;
}

function Skeleton({ width = '4rem' }: { width?: string }) {
  return <div style={{ background: '#eee', height: '1rem', width }} />;
}

export default function DetailView({ chain, address, pairId }: Props) {
  const [token, setToken] = useState<TokenMeta | null>(null);
  const [pool, setPool] = useState<PoolSummary | null>(null);
  const [core, setCore] = useState<CoreFinance | null>(null);
  const [links, setLinks] = useState<Record<string, string> | null>(null);
  const [provider, setProvider] = useState<Provider | ''>('');
  const [degraded, setDegraded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function loadFromCache() {
      const pairsKey = `${chain}:${address}`;
      const pairsData = getPairsCache(pairsKey);
      if (pairsData && !('error' in pairsData)) {
        setToken(pairsData.token);
        setPool(pairsData.pools.find((p) => p.pairId === pairId) || null);
        setProvider(pairsData.provider);
      }
      const searchData = getSearchCache(address);
      if (searchData) {
        const result = searchData.results.find((r) => r.chain === chain);
        if (result) {
          setCore(result.core);
          setLinks((result as any).links || null);
          setProvider(result.provider);
        }
      }
    }

    loadFromCache();

    async function ensureData() {
      const pairsKey = `${chain}:${address}`;
      let p = getPairsCache(pairsKey);
      if (!p) {
        const res = await pairs(chain, address);
        if (!cancelled && !('error' in res)) {
          p = res;
        }
      }
      if (p && !cancelled) {
        setToken(p.token);
        setPool(p.pools.find((pp) => pp.pairId === pairId) || null);
        setProvider(p.provider);
      }

      let s = getSearchCache(address);
      if (!s) {
        const res = await search(address);
        if (!cancelled && !('error' in res)) {
          s = res;
        }
      }
      if (s && !cancelled) {
        const result = s.results.find((r) => r.chain === chain);
        if (result) {
          setCore(result.core);
          setLinks((result as any).links || null);
          setProvider(result.provider);
        }
      }
    }

    ensureData();

    const poller = createPoller(async () => {
      const res = await search(address);
      if ('error' in res) {
        const err: any = new Error('api error');
        err.status = 500;
        throw err;
      }
      const result = res.results.find((r) => r.chain === chain);
      if (result) {
        setCore(result.core);
        setLinks((result as any).links || null);
        setProvider(result.provider);
      }
    }, 15000, {
      onError: () => setDegraded(true),
      onRecover: () => setDegraded(false),
    });
    poller.start();

    return () => {
      cancelled = true;
      poller.stop();
    };
  }, [chain, address, pairId]);

  return (
    <div style={{ fontSize: '0.875rem' }}>
      {degraded && (
        <div
          style={{
            background: 'rgba(255,0,0,0.2)',
            color: '#900',
            padding: '2px 4px',
            fontSize: '12px',
            textAlign: 'center',
            marginBottom: '0.5rem',
          }}
        >
          degraded
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div>
          {token ? (
            <>
              <div>
                <strong>{token.symbol}</strong> {token.name}
              </div>
              {pool && (
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  {pool.dex} {pool.base}/{pool.quote}
                </div>
              )}
            </>
          ) : (
            <Skeleton width="6rem" />
          )}
        </div>
        {provider && (
          <span style={{ fontSize: '0.75rem', border: '1px solid #999', padding: '0 0.25rem' }}>{provider}</span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>Price</div>
          <div>{core?.priceUsd !== undefined ? `$${core.priceUsd.toFixed(4)}` : <Skeleton />}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>FDV/MC</div>
          <div>
            {core?.fdvUsd !== undefined
              ? `$${core.fdvUsd.toLocaleString()}`
              : core?.mcUsd !== undefined
              ? `$${core.mcUsd.toLocaleString()}`
              : <Skeleton />}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>Liquidity</div>
          <div>{core?.liqUsd !== undefined ? `$${core.liqUsd.toLocaleString()}` : <Skeleton />}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>24h Vol</div>
          <div>{core?.vol24hUsd !== undefined ? `$${core.vol24hUsd.toLocaleString()}` : <Skeleton />}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>1h %</div>
          <div>{core?.priceChange1hPct !== undefined ? `${core.priceChange1hPct.toFixed(2)}%` : <Skeleton />}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>24h %</div>
          <div>{core?.priceChange24hPct !== undefined ? `${core.priceChange24hPct.toFixed(2)}%` : <Skeleton />}</div>
        </div>
      </div>
      {links && Object.keys(links).length > 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {Object.entries(links).map(([label, url]) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#4ea3ff', fontSize: '0.75rem' }}
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

