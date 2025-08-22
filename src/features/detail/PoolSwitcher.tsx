import { KeyboardArrowDown as ArrowDownIcon } from '@mui/icons-material';
import type { PoolSummary } from '../../lib/types';

interface Props {
  pools: PoolSummary[];
  current?: string;
  onSwitch: (pool: PoolSummary) => void;
}

export default function PoolSwitcher({ pools, current, onSwitch }: Props) {
  if (!pools || pools.length === 0) return null;

  const currentPool = pools.find(p => p.pairId === current) || pools[0];

  // For single pool, show simple info pill
  if (pools.length === 1) {
    return (
      <div className="pool-switcher single">
        <div className="pool-pill active">
          <div className="pool-main">
            <span className="pool-dex">{currentPool.dex}</span>
            {currentPool.version && <span className="pool-version">({currentPool.version})</span>}
            <span className="pool-address">{currentPool.poolAddress?.slice(0, 8)}...</span>
          </div>
          <div className="pool-secondary">
            <span className="pool-pair">{currentPool.base}/{currentPool.quote}</span>
            {(currentPool as any).labels?.length > 0 && (
              <div className="pool-labels">
                {(currentPool as any).labels.slice(0, 2).map((label: string) => (
                  <span key={label} className="pool-label">{label}</span>
                ))}
              </div>
            )}
          </div>
          {currentPool.gtSupported === false && (
            <span className="pool-badge limited">Limited</span>
          )}
        </div>
      </div>
    );
  }

  // For multiple pools, show dropdown style
  return (
    <div className="pool-switcher multiple">
      <div className="pool-dropdown">
        <button className="pool-current" onClick={() => {/* TODO: Open dropdown */}}>
          <div className="pool-content">
            <div className="pool-main">
              <span className="pool-dex">{currentPool.dex}</span>
              {currentPool.version && <span className="pool-version">({currentPool.version})</span>}
              <span className="pool-address">{currentPool.poolAddress?.slice(0, 8)}...</span>
            </div>
            <div className="pool-secondary">
              <span className="pool-pair">{currentPool.base}/{currentPool.quote}</span>
              {(currentPool as any).labels?.length > 0 && (
                <div className="pool-labels">
                  {(currentPool as any).labels.slice(0, 2).map((label: string) => (
                    <span key={label} className="pool-label">{label}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ArrowDownIcon className="pool-arrow" />
        </button>
        
        {/* Alternative: Show as horizontal pills for now */}
        <div className="pool-options">
          {pools.map((p) => (
            <button
              key={p.pairId}
              onClick={() => onSwitch(p)}
              className={`pool-pill ${current === p.pairId ? 'active' : ''}`}
            >
              <div className="pool-main">
                <span className="pool-dex">{p.dex}</span>
                {p.version && <span className="pool-version">({p.version})</span>}
                <span className="pool-address">{p.poolAddress?.slice(0, 8)}...</span>
              </div>
              <div className="pool-secondary">
                <span className="pool-pair">{p.base}/{p.quote}</span>
                {(p as any).labels?.length > 0 && (
                  <div className="pool-labels">
                    {(p as any).labels.slice(0, 2).map((label: string) => (
                      <span key={label} className="pool-label">{label}</span>
                    ))}
                  </div>
                )}
              </div>
              {p.gtSupported === false && (
                <span className="pool-badge limited">Limited</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

