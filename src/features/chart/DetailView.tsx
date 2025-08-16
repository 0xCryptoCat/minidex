import { Fragment, useEffect, useState } from 'react';
import type { PoolSummary, TokenResponse } from '../../lib/types';
import { token as fetchToken } from '../../lib/api';
import { formatUsd, formatCompact, formatShortAddr } from '../../lib/format';
import CopyButton from '../../components/CopyButton';
import { addressUrl } from '../../lib/explorer';
import { 
  Language as WebsiteIcon,
  Description as DocsIcon,
  Twitter as TwitterIcon,
  Telegram as TelegramIcon,
  GitHub as GitHubIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  OpenInNew as OpenInNewIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import '../../styles/detail.css';

interface Props {
  chain: string;
  address: string;
  pairId: string;
  pools: PoolSummary[];
  onSwitch: (p: PoolSummary) => void;
  hideDetailTop?: boolean;
}

const LINK_ICONS: Record<string, any> = {
  website: WebsiteIcon,
  docs: DocsIcon,
  whitepaper: DocsIcon,
  twitter: TwitterIcon,
  x: TwitterIcon,
  telegram: TelegramIcon,
  discord: TelegramIcon, // Using telegram icon as fallback
  github: GitHubIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
};

export default function DetailView({ chain, address, pairId, pools, onSwitch, hideDetailTop = false }: Props) {
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

  if (!detail) return (
    <div className="detail">
      <div className="loading-skeleton" style={{ height: 200, marginBottom: 'var(--space-4)' }} />
      <div className="loading-skeleton" style={{ height: 100 }} />
    </div>
  );

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
    <div className="detail animate-in">
      {/* Header Image and Detail Top - only if not hidden */}
      {!hideDetailTop && (
        <>
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
                    <div className="pool-selector-wrapper">
                      <select
                        value={pairId}
                        onChange={(e) => {
                          const sel = pools.find((p) => p.pairId === e.target.value);
                          if (sel) onSwitch(sel);
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
                      <ExpandMoreIcon className="pool-selector-arrow" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="detail-subline">
                <span style={{ color: 'var(--text-secondary)' }}>{active.baseToken.name}</span>
                <span className="badge">{chain}</span>
                <span className="badge">{detail.provider}</span>
                {active.gtSupported === false && <span className="badge limited">Limited</span>}
              </div>
              
              {info.description && (
                <div className="detail-desc">
                  {descExpanded ? info.description : info.description.slice(0, 300)}
                  {info.description.length > 300 && !descExpanded && (
                    <button 
                      className="detail-more" 
                      onClick={() => setDescExpanded(true)}
                      style={{
                        marginLeft: 'var(--space-2)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--telegram-blue)',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      More <ExpandMoreIcon sx={{ fontSize: 16 }} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* KPIs Grid */}
      <div className="detail-kpis">
        <div className="kpi-item">
          <span>Price USD</span>
          <strong>{fmtUsdOrDash(kpis.priceUsd)}</strong>
        </div>
        <div className="kpi-item">
          <span>Price {active.quoteToken.symbol}</span>
          <strong>{fmtUsdOrDash(kpis.priceNative)}</strong>
        </div>
        <div className="kpi-item">
          <span>Liquidity</span>
          <strong>{fmtUsdOrDash(kpis.liqUsd)}</strong>
        </div>
        <div className="kpi-item">
          <span>FDV</span>
          <strong>{fmtUsdOrDash(kpis.fdvUsd)}</strong>
        </div>
        <div className="kpi-item">
          <span>Market Cap</span>
          <strong>{fmtUsdOrDash(kpis.mcUsd)}</strong>
        </div>
        <div className="kpi-item">
          <span>24h Change</span>
          <strong className={kpis.priceChange24hPct !== undefined ? (kpis.priceChange24hPct < 0 ? 'neg' : 'pos') : undefined}>
            {fmtPct(kpis.priceChange24hPct)}
          </strong>
        </div>
        <div className="kpi-item kpi-wide">
          <span>Price Changes (5m | 1h | 6h | 24h)</span>
          <strong>{renderPriceChanges(active.priceChange)}</strong>
        </div>
        <div className="kpi-item kpi-wide">
          <span>Transactions (Total | Buys — Sells)</span>
          <strong>{renderTxns(active.txns)}</strong>
        </div>
        <div className="kpi-item kpi-wide">
          <span>Volume (5m | 1h | 6h | 24h)</span>
          <strong>{renderVolume(active.volume)}</strong>
        </div>
      </div>

      {/* Addresses */}
      <div className="detail-addrs">
        {active.pairAddress && (
          <div className="addr-row">
            <span>Pair:</span>
            <div>
              <code>{formatShortAddr(active.pairAddress)}</code>
              <CopyButton text={active.pairAddress} label="pair address" />
              {pairExplorer && (
                <a href={pairExplorer} target="_blank" rel="noopener noreferrer">
                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                </a>
              )}
            </div>
          </div>
        )}
        <div className="addr-row">
          <span>{active.baseToken.symbol}:</span>
          <div>
            <code>{formatShortAddr(active.baseToken.address)}</code>
            <CopyButton text={active.baseToken.address} label={`${active.baseToken.symbol} address`} />
            {baseExplorer && (
              <a href={baseExplorer} target="_blank" rel="noopener noreferrer">
                <OpenInNewIcon sx={{ fontSize: 16 }} />
              </a>
            )}
          </div>
        </div>
        <div className="addr-row">
          <span>{active.quoteToken.symbol}:</span>
          <div>
            <code>{active.quoteToken.address}</code>
            <CopyButton text={active.quoteToken.address} label={`${active.quoteToken.symbol} address`} />
            {quoteExplorer && (
              <a href={quoteExplorer} target="_blank" rel="noopener noreferrer">
                <OpenInNewIcon sx={{ fontSize: 16 }} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Project Links */}
      {linkItems.length > 0 && (
        <div className="detail-links">
          {linkItems.map((l, i) => {
            const IconComponent = LINK_ICONS[l.key] || WebsiteIcon;
            return (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" title={l.key}>
                <IconComponent sx={{ fontSize: 20 }} />
              </a>
            );
          })}
        </div>
      )}

      {/* Other Pools */}
      {otherPools.length > 0 && (
        <div className="detail-pools">
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            margin: '0 0 var(--space-3) 0',
            color: 'var(--text-secondary)',
          }}>
            Other Pools
          </h3>
          {otherPools.slice(0, 3).map((p) => (
            <details key={p.pairId} className="pool-item">
              <summary>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 600 }}>
                    {p.dex} {p.version && `(${p.version})`}
                  </span>
                  <span>—</span>
                  <span>{p.baseToken.symbol}/{p.quoteToken.symbol}</span>
                  <span>—</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Liq ${p.liquidity?.usd ? formatCompact(p.liquidity.usd) : '—'}
                  </span>
                  {!p.gtSupported && <span className="badge limited">Limited</span>}
                </div>
              </summary>
              <div className="pool-body">
                <div className="pool-switcher">
                  <button 
                    onClick={() => onSwitch(p)}
                    className="btn-secondary"
                    style={{ marginTop: 'var(--space-2)' }}
                  >
                    Switch to this pool
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
