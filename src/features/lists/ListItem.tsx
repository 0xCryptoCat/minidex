import { useNavigate } from 'react-router-dom';
import type { ListItem as Item } from '../../lib/types';
import { formatCompact } from '../../lib/format';

interface Props {
  item: Item;
  rank: number;
}

function pairFromId(pairId: string): string {
  const parts = pairId.split('_');
  if (parts.length >= 2) {
    const base = parts[parts.length - 2];
    const quote = parts[parts.length - 1];
    return `${base.toUpperCase()}/${quote.toUpperCase()}`;
    }
  return pairId;
}

export default function ListItem({ item, rank }: Props) {
  const navigate = useNavigate();
  const pair = pairFromId(item.pairId);
  function handleClick() {
    navigate(`/t/${item.chain}/${item.token.address}/${item.pairId}`);
  }
  const ageDays = item.createdAt
    ? Math.floor((Date.now() / 1000 - item.createdAt) / 86400)
    : undefined;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleClick();
      }}
      className="list-item-row"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: '0.5rem',
        padding: '0.5rem',
        cursor: 'pointer',
        borderBottom: '1px solid #eee',
        background: item.promoted ? '#fffbe6' : undefined,
        minHeight: 40,
      }}
    >
      <div>{rank}</div>
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.token.symbol}</strong>
        <span style={{ fontSize: '0.75rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pair}
        </span>
      </div>
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {ageDays !== undefined ? `${ageDays}d` : '-'}
      </div>
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.priceUsd !== undefined ? `$${item.priceUsd.toFixed(4)}` : '-'}
      </div>
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {formatCompact(item.liqUsd)}
      </div>
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {formatCompact(item.volWindowUsd)}
      </div>
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.priceChangePct !== undefined ? `${item.priceChangePct.toFixed(2)}%` : '-'}
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: '0.5rem',
        padding: '0.5rem',
        borderBottom: '1px solid #eee',
        minHeight: 40,
      }}
    >
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          style={{ height: 16, background: '#eee', borderRadius: 4 }}
        />
      ))}
    </div>
  );
}
