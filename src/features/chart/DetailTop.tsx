import { useState } from 'react';
import { ExpandMore as ExpandMoreIcon, KeyboardArrowDown as ArrowDownIcon } from '@mui/icons-material';
import type { PoolSummary, TokenResponse } from '../../lib/types';
import { formatShortAddr, formatCompact } from '../../lib/format';

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

  // Helper function to truncate long ticker symbols
  const truncateSymbol = (symbol: string, maxLength: number = 10) => {
    return symbol.length > maxLength ? `${symbol.slice(0, maxLength-2)}..` : symbol;
  };

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
          <img 
            src={info.imageUrl} 
            alt={`${active.baseToken.symbol} logo`} 
            onError={(e) => {
              // Fallback to letter avatar
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent && !parent.querySelector('.detail-letter')) {
                const fallback = document.createElement('div');
                fallback.className = 'detail-letter';
                fallback.textContent = active.baseToken.symbol?.[0] || '?';
                parent.appendChild(fallback);
              }
            }}
            loading="lazy" 
          />
        </div>
        
        <div className="detail-overview">
          <div className="detail-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <strong style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {active.baseToken.symbol} / {active.quoteToken.symbol}
              </strong>
              
              {/* Pool Selector Dropdown */}
              {pools.length > 1 && (
                <div className="pool-selector-wrapper">
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
                        {formatShortAddr(p.poolAddress || p.pairId)} {p.dex} {p.version || p.labels?.[0] || 'v1'} {truncateSymbol(p.baseToken?.symbol || p.base)}/{truncateSymbol(p.quoteToken?.symbol || p.quote)} ${p.liqUsd ? formatCompact(p.liqUsd) : '—'}
                      </option>
                    ))}
                  </select>
                  <span className="pool-selector-current">
                    {active.dex} {active.version || active.labels?.[0] || 'v1'}
                  </span>
                  <ArrowDownIcon className="pool-selector-arrow" />
                </div>
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
