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
          <span className="pool-main">
            {currentPool.dex} {currentPool.version && `(${currentPool.version})`}
          </span>
          <span className="pool-pair">{currentPool.base}/{currentPool.quote}</span>
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
            <span className="pool-main">
              {currentPool.dex} {currentPool.version && `(${currentPool.version})`}
            </span>
            <span className="pool-pair">{currentPool.base}/{currentPool.quote}</span>
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
              <span className="pool-main">
                {p.dex} {p.version && `(${p.version})`}
              </span>
              <span className="pool-pair">{p.base}/{p.quote}</span>
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

