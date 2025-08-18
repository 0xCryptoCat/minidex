import { useNavigate } from 'react-router-dom';
import type { SearchTokenSummary, PoolSummary } from '../../lib/types';
import { formatUsd } from '../../lib/format';
import { getChainIcon, getDexIcon } from '../../lib/icons';

interface Props { result: SearchTokenSummary }

export function SearchResultSkeleton() {
  return (
    <tr style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', minHeight: 40 }}>
      <td>
        <div style={{ width: 24, height: 24, background: 'var(--bg-elev)', borderRadius: 4 }} />
      </td>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i}>
          <div style={{ height: 16, background: 'var(--bg-elev)', borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}

export default function SearchResultItem({ result }: Props) {
  const navigate = useNavigate();
  const {
    address,
    symbol,
    name,
    icon,
    priceUsd,
    liqUsd,
    vol24hUsd,
    chainIcons,
    chainCount,
    poolCount,
    pools,
    provider,
  } = result;
  const displayedChains = (chainIcons || []).slice(0, 3);
  
  // Get unique DEXes from pools for display
  const uniqueDexes = Array.from(new Set(
    (pools || [])
      .map(p => p.dex)
      .filter(Boolean)
  )).slice(0, 3);

  const supportedPool = (pools || []).reduce<PoolSummary | undefined>((acc, p) => {
    if (p.gtSupported) {
      if (!acc || (p.liqUsd || 0) > (acc.liqUsd || 0)) return p;
    }
    return acc;
  }, undefined);
  const fallbackPool = (pools || []).reduce<PoolSummary | undefined>((acc, p) => {
    if (!acc || (p.liqUsd || 0) > (acc.liqUsd || 0)) return p;
    return acc;
  }, undefined);
  const targetPool = supportedPool || fallbackPool;
  const isSupported = pools?.some((p) => p.gtSupported);

  function handleClick() {
    const pairId = targetPool?.pairId;
    if (pairId) {
      navigate(
        `/t/${targetPool?.chain}/${address}/${pairId}?poolAddress=${
          targetPool?.poolAddress || ''
        }`
      );
    }
  }

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleClick();
      }}
      className={`search-result-item ${isSupported ? 'supported' : 'limited'}`}
    >
      <td className="token-icon-cell">
        {icon ? (
          <img 
            src={icon} 
            alt={`${symbol} logo`} 
            className="token-icon"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`token-fallback ${icon ? 'hidden' : ''}`}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'none', // Always start hidden, show only if needed
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img 
            src={`https://placehold.co/36x36/909090/ffffff?text=${symbol?.[0]?.toUpperCase() || 'T'}`}
            alt={`${symbol} placeholder`}
            style={{ width: '36px', height: '36px', borderRadius: '50%' }}
          />
        </div>
        {!icon && (
          <img 
            src={`https://placehold.co/36x36/909090/ffffff?text=${symbol?.[0]?.toUpperCase() || 'T'}`}
            alt={`${symbol} placeholder`}
            className="token-icon"
            style={{ width: '36px', height: '36px', borderRadius: '50%' }}
          />
        )}
      </td>
      <td className="token-info-cell">
        <div className="token-info">
          <div className="token-main">
            <strong className="token-symbol">{symbol}</strong>
            {!isSupported && (
              <span className="limited-badge">Limited</span>
            )}
          </div>
          <span className="token-name">{name}</span>
        </div>
      </td>
      <td className="price-cell">
        <span className="price-value">{formatUsd(priceUsd)}</span>
      </td>
      <td className="liquidity-cell">
        <span className="liq-value">{formatUsd(liqUsd)}</span>
      </td>
      <td className="volume-cell">
        <span className="vol-value">{formatUsd(vol24hUsd)}</span>
      </td>
      <td className="chains-cell">
        <div className="chain-icons" title={(chainIcons || []).join(', ')}>
          {displayedChains.map((c, i) => {
            const url = getChainIcon(c);
            return (
              <img
                key={c}
                src={url}
                alt={c}
                className="chain-icon"
                style={{ zIndex: displayedChains.length - i }}
              />
            );
          })}
          {chainCount && chainCount > displayedChains.length && (
            <span className="chain-more">+{chainCount - displayedChains.length}</span>
          )}
        </div>
      </td>
      <td className="meta-cell">
        <div className="meta-info">
          <span className="pool-count-chip">{poolCount} pool{poolCount !== 1 ? 's' : ''}</span>
          {uniqueDexes.length > 0 && (
            <div className="dex-icons" title={`DEXes: ${uniqueDexes.join(', ')}`}>
              {uniqueDexes.map((dex, index) => (
                <img 
                  key={dex}
                  src={getDexIcon(dex)} 
                  alt={dex}
                  className="dex-icon"
                  title={dex}
                  style={{ 
                    zIndex: uniqueDexes.length - index,
                    marginLeft: index > 0 ? '-4px' : '0'
                  }}
                  onError={(e) => {
                    // Fallback to placeholder with initial letter
                    e.currentTarget.src = `https://placehold.co/16x16/6366f1/ffffff?text=${dex[0].toUpperCase()}`;
                  }}
                />
              ))}
              {(pools || []).length > uniqueDexes.length && (
                <span className="dex-more" title={`${(pools || []).length - uniqueDexes.length} more DEXes`}>
                  +{(pools || []).length - uniqueDexes.length}
                </span>
              )}
            </div>
          )}
          <span className="provider-badge" title={`Data provider: ${provider}`}>
            {provider}
          </span>
        </div>
      </td>
    </tr>
  );
}
