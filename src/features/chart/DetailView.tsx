import { Fragment, useEffect, useState } from 'react';
import type { PoolSummary, TokenResponse } from '../../lib/types';
import { token as fetchToken } from '../../lib/api';
import { formatUsd, formatCompact } from '../../lib/format';
import CopyButton from '../../components/CopyButton';
import { addressUrl } from '../../lib/explorer';
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
  const kpis = {
    priceUsd: active.priceUsd,
    priceNative: active.priceNative,
    liqUsd: active.liquidity?.usd,
    fdvUsd: active.fdv,
    mcUsd: active.marketCap,
    priceChange24hPct: active.priceChange?.h24,
  };

  const fmtUsdOrDash = (v?: number) => (v !== undefined ? formatUsd(v) : '—');
  const fmtPct = (v?: number) => (v !== undefined ? `${v.toFixed(2)}%` : '—');
  const fmtCompactOrDash = (v?: number) => (v !== undefined ? formatCompact(v) : '—');

  const renderPriceChanges = (pc?: { m5?: number; h1?: number; h6?: number; h24?: number }) =>
    ['m5', 'h1', 'h6', 'h24'].map((k, i) => (
      <Fragment key={k}>
        <span
          className={
            pc?.[k as keyof typeof pc] !== undefined
              ? pc![k as keyof typeof pc]! < 0
                ? 'neg'
                : 'pos'
              : undefined
          }
        >
          {fmtPct(pc?.[k as keyof typeof pc])}
        </span>
        {i < 3 && ' | '}
      </Fragment>
    ));

  const renderTxns = (tx?: { h24?: { buys: number; sells: number } }) => {
    const h24 = tx?.h24;
    if (!h24) return '—';
    const total = h24.buys + h24.sells;
    return `${total} | ${h24.buys} — ${h24.sells}`;
  };

  const renderVolume = (v?: { m5?: number; h1?: number; h6?: number; h24?: number }) =>
    ['m5', 'h1', 'h6', 'h24'].map((k, i) => (
      <Fragment key={k}>
        {fmtCompactOrDash(v?.[k as keyof typeof v])}
        {i < 3 && ' | '}
      </Fragment>
    ));

  const linkItems: { key: string; url: string }[] = [];
  info.websites?.forEach((w) => linkItems.push({ key: (w.label || 'website').toLowerCase(), url: w.url }));
  info.socials?.forEach((s) => linkItems.push({ key: (s.type || '').toLowerCase(), url: s.url }));

  const pairExplorer = active.pairAddress
    ? addressUrl(chain as any, active.pairAddress)
    : undefined;
  const baseExplorer = addressUrl(chain as any, active.baseToken.address as any);
  const quoteExplorer = addressUrl(chain as any, active.quoteToken.address as any);

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
            <strong>
              {active.baseToken.symbol} / {active.quoteToken.symbol}
            </strong>
          </div>
          <div className="detail-subline">
            <span>{active.baseToken.name}</span>
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

      {pools.length > 1 && (
        <div className="pool-header" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Active pool: {active.dex} {active.version && `(${active.version})`} — {active.baseToken.symbol}/{active.quoteToken.symbol}
          {pools.length > 3 && (
            <select
              value={pairId}
              onChange={(e) => {
                const sel = pools.find((p) => p.pairId === e.target.value);
                if (sel) onSwitch(sel);
              }}
              style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}
            >
              {pools.map((p) => (
                <option key={p.pairId} value={p.pairId} style={{ opacity: p.gtSupported === false ? 0.5 : 1 }}>
                  {p.dex}
                  {p.version ? ` (${p.version})` : ''} — {p.base}/{p.quote}
                  {p.gtSupported === false ? ' — Limited' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="detail-kpis">
        <div><span>Price USD</span><strong>{fmtUsdOrDash(kpis.priceUsd)}</strong></div>
        <div><span>Price {active.quoteToken.symbol}</span><strong>{fmtUsdOrDash(kpis.priceNative)}</strong></div>
        <div><span>Liquidity $</span><strong>{fmtUsdOrDash(kpis.liqUsd)}</strong></div>
        <div><span>FDV $</span><strong>{fmtUsdOrDash(kpis.fdvUsd)}</strong></div>
        <div><span>MC $</span><strong>{fmtUsdOrDash(kpis.mcUsd)}</strong></div>
        <div>
          <span>24h %</span>
          <strong className={kpis.priceChange24hPct !== undefined ? (kpis.priceChange24hPct < 0 ? 'neg' : 'pos') : undefined}>
            {fmtPct(kpis.priceChange24hPct)}
          </strong>
        </div>
        <div>
          <span>priceChange m5 | h1 | h6 | h24</span>
          <strong>{renderPriceChanges(active.priceChange)}</strong>
        </div>
        <div>
          <span>txns h24: total | buys — sells</span>
          <strong>{renderTxns(active.txns)}</strong>
        </div>
        <div>
          <span>volume m5 | h1 | h6 | h24</span>
          <strong>{renderVolume(active.volume)}</strong>
        </div>
      </div>

      <div className="detail-addrs">
        {active.pairAddress && (
          <div>
            Pair: {active.pairAddress}
            <CopyButton text={active.pairAddress} />
            {pairExplorer && (
              <a href={pairExplorer} target="_blank" rel="noopener noreferrer">
                ↗
              </a>
            )}
          </div>
        )}
        <div>
          {active.baseToken.symbol}: {active.baseToken.address}
          <CopyButton text={active.baseToken.address} />
          {baseExplorer && (
            <a href={baseExplorer} target="_blank" rel="noopener noreferrer">
              ↗
            </a>
          )}
        </div>
        <div>
          {active.quoteToken.symbol}: {active.quoteToken.address}
          <CopyButton text={active.quoteToken.address} />
          {quoteExplorer && (
            <a href={quoteExplorer} target="_blank" rel="noopener noreferrer">
              ↗
            </a>
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

      {otherPools.length > 0 && (
        <div className="detail-pools">
          {otherPools.map((p) => (
            <details key={p.pairId} className="pool-item">
              <summary>
                {p.dex} {p.version && `(${p.version})`} — {p.baseToken.symbol}/{p.quoteToken.symbol} — liq $
                {p.liquidity?.usd ? formatCompact(p.liquidity.usd) : '—'}
                {!p.gtSupported && <span className="badge limited">Limited</span>}
              </summary>
              <div className="pool-body">
                <div className="pool-metrics">
                  <div><span>Price USD</span><strong>{fmtUsdOrDash(p.priceUsd)}</strong></div>
                  <div><span>Price {p.quoteToken.symbol}</span><strong>{fmtUsdOrDash(p.priceNative)}</strong></div>
                  <div><span>Liquidity $</span><strong>{fmtUsdOrDash(p.liquidity?.usd)}</strong></div>
                  <div><span>FDV $</span><strong>{fmtUsdOrDash(p.fdv)}</strong></div>
                  <div><span>MC $</span><strong>{fmtUsdOrDash(p.marketCap)}</strong></div>
                  <div>
                    <span>24h %</span>
                    <strong className={p.priceChange?.h24 !== undefined ? (p.priceChange.h24 < 0 ? 'neg' : 'pos') : undefined}>
                      {fmtPct(p.priceChange?.h24)}
                    </strong>
                  </div>
                  <div>
                    <span>priceChange m5 | h1 | h6 | h24</span>
                    <strong>{renderPriceChanges(p.priceChange)}</strong>
                  </div>
                  <div>
                    <span>txns h24: total | buys — sells</span>
                    <strong>{renderTxns(p.txns)}</strong>
                  </div>
                  <div>
                    <span>volume m5 | h1 | h6 | h24</span>
                    <strong>{renderVolume(p.volume)}</strong>
                  </div>
                </div>
                <div className="pool-switcher">
                  <button onClick={() => onSwitch(p)}>Switch to this pool</button>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
