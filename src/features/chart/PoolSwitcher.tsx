import type { PoolSummary } from '../../lib/types';

interface Props {
  pools: PoolSummary[];
  current?: string;
  onSwitch: (pool: PoolSummary) => void;
}

export default function PoolSwitcher({ pools, current, onSwitch }: Props) {
  if (!pools || pools.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      {pools.map((p) => (
        <button
          key={p.pairId}
          onClick={() => onSwitch(p)}
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '9999px',
            border: '1px solid #999',
            background: current === p.pairId ? '#ddd' : 'transparent',
          }}
        >
          {p.dex} {p.base}/{p.quote}
        </button>
      ))}
    </div>
  );
}

