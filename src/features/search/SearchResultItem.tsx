import { useNavigate } from 'react-router-dom';
import type { SearchResult } from '../../lib/types';

interface Props { result: SearchResult }

export function SearchResultSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 80px 80px 80px 80px 80px 60px',
        gap: '0.5rem',
        padding: '0.5rem',
        borderBottom: '1px solid #eee'
      }}
    >
      <div style={{ width: 24, height: 24, background: '#eee', borderRadius: 4 }} />
      <div style={{ height: 16, background: '#eee', borderRadius: 4 }} />
      <div style={{ height: 16, background: '#eee', borderRadius: 4 }} />
      <div style={{ height: 16, background: '#eee', borderRadius: 4 }} />
      <div style={{ height: 16, background: '#eee', borderRadius: 4 }} />
      <div style={{ height: 16, background: '#eee', borderRadius: 4 }} />
      <div style={{ height: 16, background: '#eee', borderRadius: 4 }} />
      <div style={{ height: 16, background: '#eee', borderRadius: 4 }} />
    </div>
  );
}

export default function SearchResultItem({ result }: Props) {
  const navigate = useNavigate();
  const { token, core, pools, chain } = result;
  function handleClick() {
    const pairId = pools[0]?.pairId;
    navigate(`/t/${chain}/${token.address}/${pairId || ''}`);
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 80px 80px 80px 80px 80px 60px',
        gap: '0.5rem',
        padding: '0.5rem',
        cursor: 'pointer',
        borderBottom: '1px solid #eee',
      }}
    >
      {token.icon ? (
        <img src={token.icon} alt={`${token.symbol} logo`} style={{ width: 24, height: 24 }} />
      ) : (
        <div style={{ width: 24, height: 24, background: '#ccc', borderRadius: 4 }} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <strong>{token.symbol}</strong>
        <span style={{ fontSize: '0.75rem', color: '#666' }}>{token.name}</span>
      </div>
      <div style={{ fontSize: '0.875rem', color: '#666' }}>{chain}</div>
      <div>{core.priceUsd !== undefined ? `$${core.priceUsd.toFixed(4)}` : '-'}</div>
      <div>{core.liqUsd !== undefined ? `$${core.liqUsd.toLocaleString()}` : '-'}</div>
      <div>{core.vol24hUsd !== undefined ? `$${core.vol24hUsd.toLocaleString()}` : '-'}</div>
      <div>{core.priceChange24hPct !== undefined ? `${core.priceChange24hPct.toFixed(2)}%` : '-'}</div>
      <div>{pools.length}</div>
    </div>
  );
}

