import { useEffect, useState } from 'react';
import type { PoolSummary, TokenResponse } from '../../lib/types';
import { token as fetchToken } from '../../lib/api';
import { formatCompact } from '../../lib/format';

interface Props {
  chain: string;
  address: string;
  pairId: string;
  pools: PoolSummary[];
  onSwitch: (p: PoolSummary) => void;
}

export default function DetailView({ chain, address, pairId, pools, onSwitch }: Props) {
  const [detail, setDetail] = useState<TokenResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchToken(chain, address).then((res) => {
      if (cancelled) return;
      if (!('error' in res)) setDetail(res);
    });
    return () => {
      cancelled = true;
    };
  }, [chain, address]);

  const currentPool = pools.find((p) => p.pairId === pairId) || null;

  if (!detail) {
    return <div style={{ fontSize: '0.875rem' }}>Loading…</div>;
  }

  const { meta, kpis, links, provider } = detail;

  return (
    <div style={{ fontSize: '0.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
        {meta.icon && (
          <img src={meta.icon} alt="" style={{ width: 24, height: 24, marginRight: 8 }} />
        )}
        <div style={{ flex: 1 }}>
          <div>
            <strong>{meta.symbol}</strong> {meta.name}
          </div>
          {currentPool && (
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              {currentPool.dex} {currentPool.base}/{currentPool.quote}
            </div>
          )}
        </div>
        {provider && (
          <span style={{ fontSize: '0.75rem', border: '1px solid #999', padding: '0 0.25rem' }}>
            {provider}
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>Price</div>
          <div>{kpis.priceUsd !== undefined ? `$${kpis.priceUsd.toFixed(4)}` : '-'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>FDV/MC</div>
          <div>
            {kpis.fdvUsd !== undefined
              ? `$${formatCompact(kpis.fdvUsd)}`
              : kpis.mcUsd !== undefined
              ? `$${formatCompact(kpis.mcUsd)}`
              : '-'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>Liquidity</div>
          <div>{kpis.liqUsd !== undefined ? `$${formatCompact(kpis.liqUsd)}` : '-'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>24h Vol</div>
          <div>{kpis.vol24hUsd !== undefined ? `$${formatCompact(kpis.vol24hUsd)}` : '-'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>24h Change</div>
          <div>{kpis.priceChange24hPct !== undefined ? `${kpis.priceChange24hPct.toFixed(2)}%` : '-'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>Age</div>
          <div>{kpis.ageDays !== undefined ? `${Math.floor(kpis.ageDays)}` : '-'}</div>
        </div>
      </div>
      <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {links.website && (
          <a href={links.website} target="_blank" rel="noreferrer" style={{ color: '#4ea3ff', fontSize: '0.75rem' }}>
            Website
          </a>
        )}
        {links.explorer && (
          <a href={links.explorer} target="_blank" rel="noreferrer" style={{ color: '#4ea3ff', fontSize: '0.75rem' }}>
            Explorer
          </a>
        )}
        {links.twitter && (
          <a href={links.twitter} target="_blank" rel="noreferrer" style={{ color: '#4ea3ff', fontSize: '0.75rem' }}>
            Twitter
          </a>
        )}
        {links.telegram && (
          <a href={links.telegram} target="_blank" rel="noreferrer" style={{ color: '#4ea3ff', fontSize: '0.75rem' }}>
            Telegram
          </a>
        )}
      </div>
      {pools.length > 1 && (
        <div style={{ marginTop: '0.5rem' }}>
          {pools.map((p) => (
            <div key={p.pairId} style={{ marginBottom: '0.25rem' }}>
              <button
                onClick={() => onSwitch(p)}
                disabled={p.pairId === pairId}
                style={{ fontSize: '0.75rem' }}
              >
                {p.dex} {p.base}/{p.quote}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
