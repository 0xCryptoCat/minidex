import type { SearchResult } from '../../lib/types';

interface Props { result: SearchResult }

export default function SearchResultItem({ result }: Props) {
  const { token, core, pools, provider, chain } = result;
  return (
    <div style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {token.icon && (
          <img src={token.icon} alt={token.symbol} style={{ width: 24, height: 24 }} />
        )}
        <div style={{ flex: 1 }}>
          <div><strong>{token.symbol}</strong> {token.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>{chain}</div>
        </div>
        <span style={{ fontSize: '0.75rem', border: '1px solid #999', padding: '0 0.25rem' }}>
          {provider}
        </span>
      </div>
      <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', gap: '1rem' }}>
        <div>Price: {core.priceUsd !== undefined ? `$${core.priceUsd.toFixed(2)}` : '-'}</div>
        <div>Liq: {core.liqUsd !== undefined ? `$${core.liqUsd.toLocaleString()}` : '-'}</div>
        <div>Vol24h: {core.vol24hUsd !== undefined ? `$${core.vol24hUsd.toLocaleString()}` : '-'}</div>
        <div>Change24h: {core.priceChange24hPct !== undefined ? `${core.priceChange24hPct.toFixed(2)}%` : '-'}</div>
      </div>
      <div style={{ marginTop: '0.25rem' }}>
        Pools:
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {pools.map((p) => (
            <li key={p.pairId}>{p.dex} {p.base}/{p.quote}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

