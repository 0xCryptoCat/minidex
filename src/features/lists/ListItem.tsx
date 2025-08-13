import { useNavigate } from 'react-router-dom';
import type { ListItem as Item, Provider } from '../../lib/types';

interface Props {
  item: Item;
  rank: number;
  provider: Provider;
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

export default function ListItem({ item, rank, provider }: Props) {
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
      onClick={handleClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 60px 80px 80px 80px 80px 60px',
        gap: '0.5rem',
        padding: '0.5rem',
        cursor: 'pointer',
        borderBottom: '1px solid #eee',
        background: item.promoted ? '#fffbe6' : undefined,
      }}
    >
      <div>{rank}</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <strong>{item.token.symbol}</strong>
        <span style={{ fontSize: '0.75rem', color: '#666' }}>{pair}</span>
      </div>
      <div>{ageDays !== undefined ? `${ageDays}d` : '-'}</div>
      <div>{item.priceUsd !== undefined ? `$${item.priceUsd.toFixed(4)}` : '-'}</div>
      <div>{item.liqUsd !== undefined ? `$${item.liqUsd.toLocaleString()}` : '-'}</div>
      <div>{item.volWindowUsd !== undefined ? `$${item.volWindowUsd.toLocaleString()}` : '-'}</div>
      <div>{item.priceChangePct !== undefined ? `${item.priceChangePct.toFixed(2)}%` : '-'}</div>
      <div style={{ justifySelf: 'end' }}>
        <span style={{ fontSize: '0.75rem', border: '1px solid #999', padding: '0 0.25rem' }}>{provider}</span>
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 60px 80px 80px 80px 80px 60px',
        gap: '0.5rem',
        padding: '0.5rem',
        borderBottom: '1px solid #eee',
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{ height: 16, background: '#eee', borderRadius: 4 }}
        />
      ))}
    </div>
  );
}
