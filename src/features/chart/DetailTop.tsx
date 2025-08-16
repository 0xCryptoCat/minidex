import { useState } from 'react';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import type { PoolSummary, TokenResponse } from '../../lib/types';

interface Props {
  detail: TokenResponse;
  pairId: string;
  pools: PoolSummary[];
  chain: string;
  onPoolSwitch: (p: PoolSummary) => void;
}

export default function DetailTop({ detail, pairId, pools, chain, onPoolSwitch }: Props) {
  const [descExpanded, setDescExpanded] = useState(false);
  
  const active = detail.pools.find((p) => p.pairId === pairId) || detail.pools[0];
  const info = detail.info || {};

  return (
    <>
      {/* Header Image */}
      {info.header && (
        <div className="detail-header-wrap">
          <img src={info.header} alt="" className="detail-header" loading="lazy" />
        </div>
      )}
      
      {/* Main Detail Section */}
      <div className="detail-top">
        <div className="detail-avatar">
          {info.imageUrl ? 
            <img src={info.imageUrl} alt={`${active.baseToken.symbol} logo`} /> : 
            <div className="detail-letter">{active.baseToken.symbol?.[0]}</div>
          }
        </div>
        
        <div className="detail-overview">
          <div className="detail-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <strong style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {active.baseToken.symbol} / {active.quoteToken.symbol}
              </strong>
              
              {/* Pool Selector Dropdown */}
              {pools.length > 1 && (
                <select
                  value={pairId}
                  onChange={(e) => {
                    const sel = pools.find((p) => p.pairId === e.target.value);
                    if (sel) onPoolSwitch(sel);
                  }}
                  className="pool-selector"
                >
                  {pools.map((p) => (
                    <option key={p.pairId} value={p.pairId}>
                      {p.dex} {p.version ? `(${p.version})` : ''} — {p.base}/{p.quote}
                      {p.gtSupported === false ? ' — Limited' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          
          <div className="detail-subline">
            <span className="token-name">{active.baseToken.name}</span>
            <span className="badge chain-badge">{chain}</span>
            <span className="badge provider-badge">{detail.provider}</span>
            {active.gtSupported === false && <span className="badge limited-badge">Limited</span>}
          </div>
          
          {info.description && (
            <div className="detail-desc">
              {descExpanded ? info.description : info.description.slice(0, 300)}
              {info.description.length > 300 && !descExpanded && (
                <button 
                  className="detail-more" 
                  onClick={() => setDescExpanded(true)}
                >
                  More <ExpandMoreIcon sx={{ fontSize: 16 }} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
