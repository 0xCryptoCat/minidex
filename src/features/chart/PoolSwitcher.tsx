import type { PoolSummary } from '../../lib/types';
import { formatCompact } from '../../lib/format';
import { useState } from 'react';

interface Props {
  pools: PoolSummary[];
  current?: string;
  onSwitch: (pool: PoolSummary) => void;
}

export default function PoolSwitcher({ pools, current, onSwitch }: Props) {
  const [filter, setFilter] = useState('');
  if (!pools || pools.length === 0) return null;

  if (pools.length > 3) {
    const lower = filter.toLowerCase();
    let filtered = pools.filter((p) =>
      `${p.dex} ${p.version || ''} ${p.base}/${p.quote}`.toLowerCase().includes(lower),
    );
    if (current && !filtered.some((p) => p.pairId === current)) {
      const cur = pools.find((p) => p.pairId === current);
      if (cur) filtered = [cur, ...filtered];
    }
    return (
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: 'var(--bg-elev)',
          zIndex: 1,
          marginBottom: '1rem',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.875rem' }}>
          Pools
          {pools.length > 10 && (
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter"
              style={{ padding: '0.25rem', marginTop: '0.25rem' }}
            />
          )}
          <select
            value={current}
            onChange={(e) => {
              const sel = pools.find((p) => p.pairId === e.target.value);
              if (sel) onSwitch(sel);
            }}
            style={{ padding: '0.25rem', marginTop: '0.25rem' }}
          >
            {filtered.map((p) => (
              <option key={p.pairId} value={p.pairId}>
                {`${p.dex}${p.version ? ` (${p.version})` : ''} — ${p.base}/${p.quote}${
                  p.liqUsd ? ` — $${formatCompact(p.liqUsd)}` : ''
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
            border: '1px solid var(--border)',
            background: current === p.pairId ? 'var(--bg-elev)' : 'transparent',
            minHeight: 40,
          }}
        >
          {p.dex} {p.base}/{p.quote}
        </button>
      ))}
    </div>
  );
}

