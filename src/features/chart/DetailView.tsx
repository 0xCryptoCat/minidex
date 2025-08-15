import { useEffect, useState } from 'react';
import type { PoolSummary, TokenResponse } from '../../lib/types';
import { token as fetchToken } from '../../lib/api';
import { formatUsd, formatCompact, formatAge } from '../../lib/format';
import CopyButton from '../../components/CopyButton';
import { explorer } from '../../lib/explorer';
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
  docs: '📄',
  whitepaper: '📄',
  twitter: '✖',
  x: '✖',
  telegram: '📣',
  discord: '🎮',
  github: '🐙',
  instagram: '📸',
  facebook: '📘',
  threads: '🧵',
  nft: '💎',
  opensea: '🛳️',
};

export default function DetailView({ chain, address, pairId, pools, onSwitch }: Props) {
  const [detail, setDetail] = useState<TokenResponse | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchToken(chain, address).then(({ data }) => {
      if (cancelled) return;
      if (!('error' in data)) setDetail(data);
    });
    return () => {
      cancelled = true;
    };
  }, [chain, address]);

  if (!detail) return <div className="detail">Loading…</div>;

  const active = detail.pools.find((p) => p.pairId === pairId) || detail.pools[0];
  const info = detail.info || {};
  const kpis = detail.kpis || {};
  const ageText = active?.pairCreatedAt
    ? formatAge(Math.floor(active.pairCreatedAt / 1000))
    : kpis.age
    ? `${kpis.age.days}d ${kpis.age.hours}h`
    : '-';

  const linkItems: { key: string; url: string }[] = [];
  info.websites?.forEach((w) => linkItems.push({ key: (w.label || 'website').toLowerCase(), url: w.url }));
  info.socials?.forEach((s) => linkItems.push({ key: (s.type || '').toLowerCase(), url: s.url }));

  const pairExplorer = explorer(chain, active.pairAddress);
  const baseExplorer = explorer(chain, active.baseToken.address);
  const quoteExplorer = explorer(chain, active.quoteToken.address);

  const otherPools = detail.pools.filter((p) => p.pairId !== active.pairId);

  return (
    <div className="detail">
      {info.header && (
        <div className="detail-header-wrap">
          <img src={info.header} alt="" className="detail-header" loading="lazy" />
        </div>
      )}
      <div className="detail-top">
        <div className="detail-avatar">
          {info.imageUrl ? <img src={info.imageUrl} alt="" /> : <div className="detail-letter">{active.baseToken.symbol?.[0]}</div>}
        </div>
        <div className="detail-overview">
          <div className="detail-title">
            <strong>{active.baseToken.symbol}</strong> / {active.quoteToken.symbol}
          </div>
          <div className="detail-badges">
            <span className="badge">{chain}</span>
            <span className="badge">{detail.provider}</span>
            {active.gtSupported === false && <span className="badge limited">Limited</span>}
          </div>
          {info.description && (
            <div className="detail-desc">
              {descExpanded ? info.description : info.description.slice(0, 300)}
              {info.description.length > 300 && !descExpanded && (
                <button className="detail-more" onClick={() => setDescExpanded(true)}>
                  More
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {linkItems.length > 0 && (
        <div className="detail-links">
          {linkItems.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" title={l.key}>
              {LINK_ICONS[l.key] || '🔗'}
            </a>
          ))}
        </div>
      )}

      <div className="detail-kpis">
        <div><span>Price USD</span><strong>{formatUsd(kpis.priceUsd)}</strong></div>
        <div><span>Price {active.quoteToken.symbol}</span><strong>{formatUsd(kpis.priceNative)}</strong></div>
        <div><span>Liquidity $</span><strong>{formatUsd(kpis.liqUsd)}</strong></div>
        <div><span>FDV $</span><strong>{formatUsd(kpis.fdvUsd)}</strong></div>
        <div><span>MC $</span><strong>{formatUsd(kpis.mcUsd)}</strong></div>
        <div><span>24h %</span><strong>{kpis.priceChange24hPct !== undefined ? `${kpis.priceChange24hPct.toFixed(2)}%` : '-'}</strong></div>
        <div><span>Age</span><strong>{ageText}</strong></div>
      </div>

      <div className="detail-extra">
        <div className="detail-row">
          PriceChange m5/h1/h6/h24:{' '}
          {active.priceChange ? `${active.priceChange.m5 ?? '-'} / ${active.priceChange.h1 ?? '-'} / ${active.priceChange.h6 ?? '-'} / ${active.priceChange.h24 ?? '-'}` : '-'}
        </div>
        <div className="detail-row">
          Txns m5/h1/h6/h24:{' '}
          {active.txns
            ? `${active.txns.m5 ? active.txns.m5.buys + active.txns.m5.sells : '-'} / ${active.txns.h1 ? active.txns.h1.buys + active.txns.h1.sells : '-'} / ${active.txns.h6 ? active.txns.h6.buys + active.txns.h6.sells : '-'} / ${active.txns.h24 ? active.txns.h24.buys + active.txns.h24.sells : '-'}`
            : '-'}
        </div>
        <div className="detail-row">
          Volume m5/h1/h6/h24:{' '}
          {active.volume
            ? `${formatCompact(active.volume.m5)} / ${formatCompact(active.volume.h1)} / ${formatCompact(active.volume.h6)} / ${formatCompact(active.volume.h24)}`
            : '-'}
        </div>
      </div>

      <div className="detail-addrs">
        {active.pairAddress && (
          <div>
            Pair: {active.pairAddress}
            <CopyButton text={active.pairAddress} />
            {pairExplorer.address && (
              <a href={pairExplorer.address} target="_blank" rel="noopener noreferrer">
                ↗
              </a>
            )}
          </div>
        )}
        <div>
          {active.baseToken.symbol}: {active.baseToken.address}
          <CopyButton text={active.baseToken.address} />
          {baseExplorer.address && (
            <a href={baseExplorer.address} target="_blank" rel="noopener noreferrer">
              ↗
            </a>
          )}
        </div>
        <div>
          {active.quoteToken.symbol}: {active.quoteToken.address}
          <CopyButton text={active.quoteToken.address} />
          {quoteExplorer.address && (
            <a href={quoteExplorer.address} target="_blank" rel="noopener noreferrer">
              ↗
            </a>
          )}
        </div>
      </div>

      {otherPools.length > 0 && (
        <div className="detail-pools">
          {otherPools.map((p) => (
            <div key={p.pairId} className="pool-item">
              <div className="pool-header">
                {p.dex} {p.version && `(${p.version})`} — {p.baseToken.symbol}/{p.quoteToken.symbol} — liq ${
                  p.liquidity?.usd ? formatCompact(p.liquidity.usd) : '-'
                }
                {!p.gtSupported && <span className="badge limited">Limited</span>}
              </div>
              <button className="switch-btn" onClick={() => onSwitch(p)}>
                Switch to this pool
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
