import { useNavigate } from 'react-router-dom';
import type { SearchResult } from '../../lib/types';

interface Props { result: SearchResult }

export function SearchResultSkeleton() {
  return (
    <tr>
      <td><div style={{ width: 24, height: 24, background: '#eee', borderRadius: 4 }} /></td>
      <td><div style={{ height: 16, background: '#eee', borderRadius: 4 }} /></td>
      <td><div style={{ height: 16, background: '#eee', borderRadius: 4 }} /></td>
      <td><div style={{ height: 16, background: '#eee', borderRadius: 4 }} /></td>
      <td><div style={{ height: 16, background: '#eee', borderRadius: 4 }} /></td>
      <td><div style={{ height: 16, background: '#eee', borderRadius: 4 }} /></td>
      <td><div style={{ height: 16, background: '#eee', borderRadius: 4 }} /></td>
    </tr>
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
    <tr
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
      style={{ cursor: 'pointer' }}
    >
      <td>
        {token.icon ? (
          <img src={token.icon} alt={`${token.symbol} logo`} style={{ width: 24, height: 24 }} />
        ) : (
          <div style={{ width: 24, height: 24, background: '#ccc', borderRadius: 4 }} />
        )}
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong>{token.symbol}</strong>
          <span style={{ fontSize: '0.75rem', color: '#666' }}>{token.name}</span>
        </div>
      </td>
      <td style={{ fontSize: '0.875rem', color: '#666' }}>{chain}</td>
      <td>{core.priceUsd !== undefined ? `$${core.priceUsd.toFixed(4)}` : '-'}</td>
      <td>{core.liqUsd !== undefined ? `$${core.liqUsd.toLocaleString()}` : '-'}</td>
      <td>{core.vol24hUsd !== undefined ? `$${core.vol24hUsd.toLocaleString()}` : '-'}</td>
      <td>{core.priceChange24hPct !== undefined ? `${core.priceChange24hPct.toFixed(2)}%` : '-'}</td>
    </tr>
  );
}
