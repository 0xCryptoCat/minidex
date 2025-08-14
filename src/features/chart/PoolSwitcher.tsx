import type { PoolSummary } from '../../lib/types';

interface Props {
  pools: PoolSummary[];
  current?: string;
  onSwitch: (pool: PoolSummary) => void;
}

export default function PoolSwitcher({ pools, current, onSwitch }: Props) {
  if (!pools || pools.length === 0) return null;

  if (pools.length > 3) {
    return (
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 1,
          marginBottom: '1rem',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.875rem' }}>
          Pools
          <select
            value={current}
            onChange={(e) => {
              const sel = pools.find((p) => p.pairId === e.target.value);
              if (sel) onSwitch(sel);
            }}
            style={{ padding: '0.25rem', marginTop: '0.25rem' }}
          >
            {pools.map((p) => (
              <option key={p.pairId} value={p.pairId}>
                {`${p.dex}${p.version ? ` (${p.version})` : ''} — ${p.base}/${p.quote}${
                  p.liqUsd
                    ? ` — $${p.liqUsd.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}`
                    : ''
                }`}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

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

