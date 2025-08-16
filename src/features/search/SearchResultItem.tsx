import { useNavigate } from 'react-router-dom';
import type { SearchTokenSummary, PoolSummary } from '../../lib/types';
import { formatUsd } from '../../lib/format';
import { CHAIN_TO_ICON } from '../../lib/chains';

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
      style={{
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        minHeight: 40,
        opacity: isSupported ? 1 : 0.5,
      }}
    >
      <td>
        {icon ? (
          <img src={icon} alt={`${symbol} logo`} style={{ width: 24, height: 24 }} />
        ) : (
          <div style={{ width: 24, height: 24, background: 'var(--bg-elev)', borderRadius: 4 }} />
        )}
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
            <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{symbol}</strong>
            {!isSupported && (
              <span
                style={{
                  fontSize: '0.625rem',
                  background: 'var(--bg-elev)',
                  padding: '0 4px',
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              >
                Limited
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
        </div>
      </td>
      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {formatUsd(priceUsd)}
      </td>
      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {formatUsd(liqUsd)}
      </td>
      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {formatUsd(vol24hUsd)}
      </td>
      <td>
        <div
          className="chain-icons"
          title={(chainIcons || []).join(', ')}
        >
          {displayedChains.map((c, i) => {
            const url = CHAIN_TO_ICON[c];
            if (!url) return null;
            return (
              <img
                key={c}
                src={url}
                alt={c}
                style={{ zIndex: displayedChains.length - i }}
              />
            );
          })}
          {chainCount && chainCount > displayedChains.length && (
            <span className="chain-more">+{chainCount - displayedChains.length}</span>
          )}
        </div>
      </td>
      <td style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="pool-count-chip">{poolCount} pools</span>
        <span className="provider-badge" aria-label={`data provider ${provider}`}>
          {provider}
        </span>
      </td>
    </tr>
  );
}
