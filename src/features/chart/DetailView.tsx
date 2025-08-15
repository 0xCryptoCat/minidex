import { useEffect, useState } from 'react';
import type { PoolSummary, TokenResponse, TokenPairInfo } from '../../lib/types';
import { token as fetchToken } from '../../lib/api';
import { formatCompact, formatAge, formatUsd } from '../../lib/format';
import '../../styles/detail.css';

interface Props {
  chain: string;
  address: string;
  pairId: string;
  pools: PoolSummary[];
  onSwitch: (p: PoolSummary) => void;
}

const LINK_ICONS: Record<string, string> = {
  website: '🌐',
  twitter: '🐦',
  telegram: '📢',
  discord: '💬',
  github: '🐙',
  medium: '✍️',
  instagram: '📸',
  facebook: '📘',
  threads: '🧵',
  nft: '🖼️',
  docs: '📚',
};

const EXPLORER_ADDR: Record<string, string> = {
  ethereum: 'https://etherscan.io/address/',
  arbitrum: 'https://arbiscan.io/address/',
  polygon: 'https://polygonscan.com/address/',
  bsc: 'https://bscscan.com/address/',
  base: 'https://basescan.org/address/',
  optimism: 'https://optimistic.etherscan.io/address/',
  avalanche: 'https://snowtrace.io/address/',
};

export default function DetailView({ chain, address, pairId, pools, onSwitch }: Props) {
  const [detail, setDetail] = useState<TokenResponse | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchToken(chain, address).then((res) => {
      if (cancelled) return;
      if (!('error' in res)) setDetail(res);
    });
    return () => {
      cancelled = true;
    };
  }, [chain, address]);

  if (!detail) {
    return <div className="detail">Loading…</div>;
  }

  const { meta, kpis, imageUrl, headerUrl, description, websites, socials, provider, pairs } = detail;
  const ageSec =
    kpis.ageHours !== undefined
      ? kpis.ageHours * 3600
      : kpis.ageDays !== undefined
      ? kpis.ageDays * 86400
      : undefined;
  const createdTs = ageSec ? Math.floor(Date.now() / 1000 - ageSec) : undefined;
  const currentPool = pools.find((p) => p.pairId === pairId);

  const renderLinks = () => {
    const items: { key: string; url: string }[] = [];
    websites?.forEach((w) => {
      if (w?.url) items.push({ key: (w.label || 'website').toLowerCase(), url: w.url });
    });
    socials?.forEach((s) => {
      if (s?.url) items.push({ key: (s.type || '').toLowerCase(), url: s.url });
    });
    if (!items.length) return null;
    return (
      <div className="detail-links">
        {items.map((l, i) => {
          const icon = LINK_ICONS[l.key] || '🔗';
          return (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener"
              aria-label={l.key}
            >
              {icon}
            </a>
          );
        })}
      </div>
    );
  };

  const renderPool = (p: TokenPairInfo) => {
    const explorer = p.poolAddress ? EXPLORER_ADDR[chain]?.concat(p.poolAddress) : undefined;
    const age = p.pairCreatedAt ? formatAge(p.pairCreatedAt) : '-';
    const txStr = p.txns
      ? `${p.txns.m5 ?? '-'} / ${p.txns.h1 ?? '-'} / ${p.txns.h6 ?? '-'} / ${p.txns.h24 ?? '-'}`
      : '-';
    const volStr = p.volume
      ? `${formatCompact(p.volume.m5)} / ${formatCompact(p.volume.h1)} / ${formatCompact(
          p.volume.h6
        )} / ${formatCompact(p.volume.h24)}`
      : '-';
    const pcStr = p.priceChange
      ? `${p.priceChange.m5 ?? '-'}% / ${p.priceChange.h1 ?? '-'}% / ${p.priceChange.h6 ?? '-'}% / ${
          p.priceChange.h24 ?? '-'
        }%`
      : '-';
    const liqStr = p.liquidity
      ? `${formatCompact(p.liquidity.base)} / ${formatCompact(p.liquidity.quote)} / ${formatCompact(
          p.liquidity.usd
        )}`
      : '-';
    return (
      <details key={p.pairId} className="pool-item" open={p.pairId === pairId}>
        <summary>
          {`${p.dex}${p.version ? ` (${p.version})` : ''} — ${p.base}/${p.quote} — liq $${
            p.liqUsd ? formatCompact(p.liqUsd) : '-' }`}
          {p.gtSupported === false && <span className="badge limited">Limited</span>}
        </summary>
        <div className="pool-body">
          <div className="pool-metrics">
            <div><span>Price USD</span><strong>{formatUsd(p.priceUsd)}</strong></div>
            <div><span>Price Native</span><strong>{formatUsd(p.priceNative)}</strong></div>
            <div><span>Txns m5/h1/h6/h24</span><strong>{txStr}</strong></div>
            <div><span>Vol m5/h1/h6/h24</span><strong>{volStr}</strong></div>
            <div><span>Δ m5/h1/h6/h24</span><strong>{pcStr}</strong></div>
            <div><span>Liq base/quote/usd</span><strong>{liqStr}</strong></div>
            <div><span>FDV</span><strong>{formatUsd(p.fdv)}</strong></div>
            <div><span>MC</span><strong>{formatUsd(p.marketCap)}</strong></div>
            <div><span>Age</span><strong>{age}</strong></div>
          </div>
          <div className="pool-links">
            {p.pairUrl && (
              <a href={p.pairUrl} target="_blank" rel="noopener">
                DexScreener
              </a>
            )}
            {p.poolAddress && (
              <button onClick={() => navigator.clipboard.writeText(p.poolAddress!)}>Copy</button>
            )}
            {explorer && (
              <a href={explorer} target="_blank" rel="noopener">
                Explorer
              </a>
            )}
          </div>
          {p.gtSupported === false && (
            <div className="pool-note">Chart/Trades limited on this DEX.</div>
          )}
        </div>
      </details>
    );
  };

  const desc = description || '';
  const shortDesc = desc.slice(0, 300);

  return (
    <div className="detail">
      {headerUrl && <img src={headerUrl} alt="" className="detail-header" />}
      <div className="detail-top">
        <div className="detail-avatar">
          {imageUrl || meta.icon ? (
            <img src={imageUrl || meta.icon} alt="" />
          ) : (
            <div className="detail-letter">{meta.symbol?.[0] || '?'}</div>
          )}
        </div>
        <div className="detail-overview">
          <div className="detail-title">
            <strong>{meta.symbol}</strong> {meta.name}
          </div>
          <div className="detail-badges">
            <span className="badge">{chain}</span>
            {provider && <span className="badge">{provider}</span>}
            {currentPool?.gtSupported === false && <span className="badge limited">Limited</span>}
          </div>
        </div>
      </div>
      {desc && (
        <div className="detail-desc">
          {descExpanded ? desc : shortDesc}
          {desc.length > 300 && !descExpanded && (
            <button className="detail-more" onClick={() => setDescExpanded(true)}>
              More
            </button>
          )}
        </div>
      )}
      {renderLinks()}
      <div className="detail-kpis">
        <div><span>Price</span><strong>{formatUsd(kpis.priceUsd)}</strong></div>
        <div><span>FDV</span><strong>{formatUsd(kpis.fdvUsd)}</strong></div>
        <div><span>MC</span><strong>{formatUsd(kpis.mcUsd)}</strong></div>
        <div><span>Liquidity</span><strong>{formatUsd(kpis.liqUsd)}</strong></div>
        <div><span>24h Vol</span><strong>{formatUsd(kpis.vol24hUsd)}</strong></div>
        <div>
          <span>24h %</span>
          <strong>
            {kpis.priceChange24hPct !== undefined ? `${kpis.priceChange24hPct.toFixed(2)}%` : '-'}
          </strong>
        </div>
        <div><span>Age</span><strong>{createdTs ? formatAge(createdTs) : '-'}</strong></div>
      </div>
      <div className="detail-pools">{pairs.map(renderPool)}</div>
      {pools.length > 1 && (
        <div className="pool-switcher">
          {pools.map((p) => (
            <button
              key={p.pairId}
              onClick={() => onSwitch(p)}
              disabled={p.pairId === pairId}
            >
              {`${p.dex}${p.version ? ` (${p.version})` : ''} — ${p.base}/${p.quote}${
                p.liqUsd ? ` — $${formatCompact(p.liqUsd)}` : ''
              }`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
