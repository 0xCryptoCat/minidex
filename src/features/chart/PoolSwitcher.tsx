import type { PoolSummary } from '../../lib/types';
interface Props {
  pools: PoolSummary[];
  current?: string;
  onSwitch: (pool: PoolSummary) => void;
}

export default function PoolSwitcher({ pools, current, onSwitch }: Props) {
  if (!pools || pools.length === 0 || pools.length > 3) return null;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      {pools.map((p) => (
        <button
          key={p.pairId}
          onClick={() => onSwitch(p)}
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '9999px',
            border: '1px solid var(--border)',
            background: current === p.pairId ? 'var(--bg-elev)' : 'transparent',
            minHeight: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            opacity: p.gtSupported === false ? 0.5 : 1,
          }}
        >
          {p.dex} {p.base}/{p.quote}
          {p.gtSupported === false && (
            <span
              style={{
                fontSize: '0.625rem',
                background: 'var(--bg-elev)',
                padding: '0 4px',
                borderRadius: 4,
              }}
            >
              Limited
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

