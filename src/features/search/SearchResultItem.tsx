import { useNavigate } from 'react-router-dom';
import type { SearchResult } from '../../lib/types';
import { formatCompact } from '../../lib/format';

interface Props { result: SearchResult }

export function SearchResultSkeleton() {
  return (
    <tr style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', minHeight: 40 }}>
      <td>
        <div style={{ width: 24, height: 24, background: '#eee', borderRadius: 4 }} />
      </td>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i}>
          <div style={{ height: 16, background: '#eee', borderRadius: 4 }} />
        </td>
      ))}
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
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleClick();
      }}
      style={{
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        minHeight: 40,
      }}
    >
      <td>
        {token.icon ? (
          <img src={token.icon} alt={`${token.symbol} logo`} style={{ width: 24, height: 24 }} />
        ) : (
          <div style={{ width: 24, height: 24, background: '#ccc', borderRadius: 4 }} />
        )}
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{token.symbol}</strong>
          <span style={{ fontSize: '0.75rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {token.name}
          </span>
        </div>
      </td>
      <td style={{ fontSize: '0.875rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {chain}
      </td>
      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {core.priceUsd !== undefined ? `$${core.priceUsd.toFixed(4)}` : '-'}
      </td>
      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {formatCompact(core.liqUsd)}
      </td>
      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {formatCompact(core.vol24hUsd)}
      </td>
      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {core.priceChange24hPct !== undefined ? `${core.priceChange24hPct.toFixed(2)}%` : '-'}
      </td>
    </tr>
  );
}
