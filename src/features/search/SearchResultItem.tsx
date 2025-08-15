import { useNavigate } from 'react-router-dom';
import type { SearchTokenSummary, PoolSummary } from '../../lib/types';
import { formatCompact } from '../../lib/format';

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
              color: 'var(--muted)',
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
        {priceUsd !== undefined ? `$${priceUsd.toFixed(4)}` : '-'}
      </td>
      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {formatCompact(liqUsd)}
      </td>
      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {formatCompact(vol24hUsd)}
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {chainIcons?.map((c, i) => (
            <img
              key={c}
              src={`https://icons.llamao.fi/icons/chains/rsz_${c}.jpg`}
              alt={c}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                marginLeft: i === 0 ? 0 : -8,
                border: '2px solid var(--bg)',
                zIndex: chainIcons.length - i,
              }}
            />
          ))}
          {chainCount && chainCount > chainIcons.length && (
            <span
              style={{
                marginLeft: 4,
                fontSize: '0.75rem',
                background: 'var(--bg-elev)',
                padding: '0 4px',
                borderRadius: 4,
              }}
            >
              +{chainCount - chainIcons.length}
            </span>
          )}
        </div>
      </td>
      <td style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {poolCount}
        <span className="provider-badge" aria-label={`data provider ${provider}`}>
          {provider}
        </span>
      </td>
    </tr>
  );
}
