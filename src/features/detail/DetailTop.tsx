import { useState } from 'react';
import { ExpandMore as ExpandMoreIcon, KeyboardArrowDown as ArrowDownIcon, RocketLaunch } from '@mui/icons-material';
import type { PoolSummary, TokenResponse } from '../../lib/types';
import { formatShortAddr, formatCompact } from '../../lib/format';
import { getChainIcon } from '../../lib/chain-icons';
import { getDexIcon } from '../../lib/icons';

interface Props {
  detail: TokenResponse;
  pairId: string;
  pools: PoolSummary[];
  chain: string;
  onPoolSwitch: (p: PoolSummary) => void;
}

export default function DetailTop({ detail, pairId, pools, chain, onPoolSwitch }: Props) {
  const [descExpanded, setDescExpanded] = useState(false);
  
  // Find the active pool based on current pairId - this will update when pairId changes
  const active = pools.find((p) => p.pairId === pairId) || detail.pools.find((p) => p.pairId === pairId) || detail.pools[0];
  const info = active?.info || pools.find(p => p.info)?.info || {};

  // Helper function to truncate long ticker symbols
  const truncateSymbol = (symbol: string, maxLength: number = 10) => {
    return symbol.length > maxLength ? `${symbol.slice(0, maxLength-2)}..` : symbol;
  };

  // take the active pool's createdAt timestamp and turn it into a Date object, then calculate what time ago that was
  const timeAgo = (timestamp: number) => {
    if (!timestamp || timestamp <= 0) return 'Unknown';
    
    // Handle both seconds and milliseconds timestamps
    const date = timestamp > 10000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If diff is negative, the timestamp is in the future (invalid)
    if (diff < 0) return 'Unknown';
    
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  }

  // boolean check if the pool is recent (less than 1 day old) using the timeAgo value
  const isRecentPool = (timestamp: number) => {
    if (!timestamp || timestamp <= 0) return false;
    
    // Handle both seconds and milliseconds timestamps
    const date = timestamp > 10000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff > 0 && diff < 24 * 60 * 60 * 1000; // less than 1 day and valid, returns true
  };

  if (!active) {
    return (
      <div className="detail-top">
        <div className="loading-skeleton" style={{ height: 100 }} />
      </div>
    );
  }

  return (
    <>
      {/* Main Detail Section */}
      <div className="detail-top">
        <div className="detail-avatar">
          <img 
            src={info.imageUrl} 
            alt={`${active.baseToken?.symbol || 'Token'} logo`} 
            onError={(e) => {
              // Fallback to letter avatar
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent && !parent.querySelector('.detail-letter')) {
                const fallback = document.createElement('div');
                fallback.className = 'detail-letter';
                fallback.textContent = active.baseToken?.symbol?.[0] || '?';
                parent.appendChild(fallback);
              }
            }}
            loading="lazy" 
          />
        </div>
        
        <div className="detail-overview">
          <div className="detail-title">
            <div style={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {/* Pool Symbols */}
              <strong style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {active.baseToken?.symbol || active.base || 'Token'} / {active.quoteToken?.symbol || active.quote || 'Token'}
              </strong>

              {/* Pool selector and time of creation */}
              <div className="detail-pair-id">
                {/* Pool Selector Dropdown - Always show */}
                <div className="pool-selector-wrapper">
                  <select
                    value={pairId}
                    onChange={(e) => {
                      const sel = pools.find((p) => p.pairId === e.target.value);
                      if (sel) onPoolSwitch(sel);
                    }}
                    className="pool-selector"
                    style={{ minWidth: pools.length > 1 ? 'auto' : '200px' }}
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

                {/* Pair created at tag */}
                {active.pairCreatedAt && (
                  <div className="pair-created-at" style={{ color: 'var(--text-muted)' }}>
                    <RocketLaunch style={{ fontSize: 16 }} />{timeAgo(active.pairCreatedAt)} {isRecentPool(active.pairCreatedAt) && <span role="img" aria-label="new">🌱</span>} 
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="detail-subline">
            <span style={{ color: 'var(--text-secondary)' }}>{active.baseToken?.name || `${active.baseToken?.symbol || active.base} Token`}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Chain icon */}
              {getChainIcon(chain) && (
                <img src={getChainIcon(chain)} alt={chain} style={{ width: 20, height: 20 }} />
              )}
              {/* Active DEX icon */}
              <img 
                src={getDexIcon(active.dex)} 
                alt={active.dex}
                style={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%',
                  border: '1.5px solid var(--bg-card)'
                }}
                onError={(e) => {
                  e.currentTarget.src = `https://placehold.co/20x20/6366f1/ffffff?text=${active.dex[0].toUpperCase()}`;
                }}
                title={`${active.dex} ${active.version || active.labels?.[0] || ''}`}
              />
            </div>
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
