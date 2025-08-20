import { Fragment, useState } from 'react';
import type { PoolSummary } from '../../lib/types';
import { formatUsd, formatCompact, formatShortAddr, formatSmallPrice } from '../../lib/format';
import CopyButton from '../../components/CopyButton';
import TwitterFeedPanel from '../../components/TwitterFeedPanel';
import { SecurityPanel } from '../../components/SecurityPanel';
import { TokenKPIs, OwnerMetrics } from '../../components/TokenKPIs';
import { useGoSecurity } from '../../lib/useGoSecurity';
import { addressUrl } from '../../lib/explorer';
import { getChainIcon, getSocialIcon } from '../../lib/chain-icons';
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
  const [descExpanded, setDescExpanded] = useState(false);

  // Find the active pool from the provided pools data
  const active = pools.find((p) => p.pairId === pairId) || pools[0];
  
  // Fetch security data for the token
  const { loading: securityLoading, error: securityError, data: securityData } = useGoSecurity(chain, address);
  
  // Helper function to truncate long ticker symbols
  const truncateSymbol = (symbol: string, maxLength: number = 10) => {
    return symbol.length > maxLength ? `${symbol.slice(0, maxLength-2)}..` : symbol;
  };
  
  if (!active) return (
    <div className="detail">
      <div className="loading-skeleton" style={{ height: 200, marginBottom: 'var(--space-4)' }} />
      <div className="loading-skeleton" style={{ height: 100 }} />
    </div>
  );

  // Use the active pool's info, fallback to first pool's info if current has none
  const info = active.info || pools.find(p => p.info)?.info || {};
  
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

  const linkItems: { key: string; url: string }[] = [];
  info.websites?.forEach((w) => linkItems.push({ key: (w.label || 'website').toLowerCase(), url: w.url }));
  info.socials?.forEach((s) => linkItems.push({ key: (s.type || '').toLowerCase(), url: s.url }));

  const pairExplorer = active.pairAddress
    ? addressUrl(chain as any, active.pairAddress)
    : undefined;
  const baseExplorer = active.baseToken ? addressUrl(chain as any, active.baseToken.address as any) : undefined;
  const quoteExplorer = active.quoteToken ? addressUrl(chain as any, active.quoteToken.address as any) : undefined;

  return (
    <div className="detail animate-in">
      {/* Header Image - always show if available */}
      {info.header && (
        <div className="detail-header-wrap">
          <img src={info.header} alt="" className="detail-header" loading="lazy" />
        </div>
      )}
      
      {/* Detail Top Section - only if not hidden */}
      {!hideDetailTop && (
        <>
          {/* Main Detail Section */}
          <div className="detail-top">
            <div className="detail-avatar">
              <img src={info.imageUrl} alt={`${active.baseToken?.symbol || active.base} logo`} loading="lazy" />
            </div>
            
            <div className="detail-overview">
              <div className="detail-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <strong style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {active.baseToken?.symbol || active.base} / {active.quoteToken?.symbol || active.quote}
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
                            {formatShortAddr(p.poolAddress || p.pairId)} {p.dex} {p.version || p.labels?.[0] || 'v1'} {p.baseToken?.symbol || p.base}/{p.quoteToken?.symbol || p.quote} ${p.liqUsd ? formatCompact(p.liqUsd) : '—'}
                          </option>
                        ))}
                      </select>
                      <span className="pool-selector-current">
                        {active.dex} {active.version || active.labels?.[0] || 'v1'}
                      </span>
                      <ExpandMoreIcon className="pool-selector-arrow" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="detail-subline">
                <span style={{ color: 'var(--text-secondary)' }}>{active.baseToken?.name || `${active.baseToken?.symbol || active.base} Token`}</span>
                {getChainIcon(chain) && (
                  <img src={getChainIcon(chain)} alt={chain} style={{ width: 20, height: 20 }} />
                )}
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
              
              {/* Social Links */}
              {(info.websites?.length || info.socials?.length) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {info.websites?.map((site, i) => (
                    <a 
                      key={`website-${i}`}
                      href={site.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: 'var(--bg-elev)',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--accent-telegram)';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'var(--bg-elev)';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                    >
                      <span>{getSocialIcon('website')}</span>
                      {site.label}
                    </a>
                  ))}
                  {info.socials?.map((social, i) => (
                    <a 
                      key={`social-${i}`}
                      href={social.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: 'var(--bg-elev)',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--accent-telegram)';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'var(--bg-elev)';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                    >
                      <span>{getSocialIcon(social.type)}</span>
                      {social.type}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Project Links */}
      {linkItems.length > 0 && (
        <div className="detail-links">
          {linkItems.map((l, i) => {
            const IconComponent = LINK_ICONS[l.key] || WebsiteIcon;
            return (
              <a 
                key={i} 
                href={l.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                title={l.key}
                className="detail-link"
              >
                <IconComponent sx={{ fontSize: 20 }} />
              </a>
            );
          })}
        </div>
      )}

      {/* X/Twitter Feed */}
      {active.baseToken && (
        <TwitterFeedPanel
          tokenAddress={active.baseToken.address}
          chainId={chain}
        />
      )}

      {/* Addresses */}
      <div className="detail-addrs">
        {active.pairAddress && (
          <div className="addr-row">
            <span>Pair:</span>
            <div>
              <span>{formatShortAddr(active.pairAddress)}</span>
              <CopyButton text={active.pairAddress} label="pair address" />
              {pairExplorer && (
                <a href={pairExplorer} target="_blank" rel="noopener noreferrer">
                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                </a>
              )}
            </div>
          </div>
        )}
        {active.baseToken && (
          <div className="addr-row">
            <span>{truncateSymbol(active.baseToken.symbol)}:</span>
            <div>
              <span>{formatShortAddr(active.baseToken.address)}</span>
              <CopyButton text={active.baseToken.address} label={`${active.baseToken.symbol} address`} />
              {baseExplorer && (
                <a href={baseExplorer} target="_blank" rel="noopener noreferrer">
                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                </a>
              )}
            </div>
          </div>
        )}
        {active.quoteToken && (
          <div className="addr-row">
            <span>{truncateSymbol(active.quoteToken.symbol)}:</span>
            <div>
              <span>{formatShortAddr(active.quoteToken.address)}</span>
              <CopyButton text={active.quoteToken.address} label={`${active.quoteToken.symbol} address`} />
              {quoteExplorer && (
                <a href={quoteExplorer} target="_blank" rel="noopener noreferrer">
                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* KPIs Grid */}
      <div className="detail-kpis">
        <div className="kpi-item">
          <span>Price USD</span>
          <strong>{formatSmallPrice(active.priceUsd)}</strong>
        </div>
        <div className="kpi-item">
          <span>Price {active.quoteToken?.symbol || active.quote}</span>
          <strong>{active.priceNative ? formatSmallPrice(Number(active.priceNative)) : '—'}</strong>
        </div>
        
        {/* Three-column KPI row for Liquidity, FDV, Market Cap */}
        {active.fdv && active.marketCap && Math.abs(active.fdv - active.marketCap) < 1000 ? (
          <>
            <div className="kpi-item">
              <span>Liquidity</span>
              <strong>{formatUsd(active.liquidity?.usd)}</strong>
            </div>
            <div className="kpi-item">
              <span>FDV/MKT CAP</span>
              <strong>{formatUsd(active.fdv)}</strong>
            </div>
          </>
        ) : (
          <div className="kpi-three-col">
            <div className="kpi-item">
              <span>Liquidity</span>
              <strong>{formatUsd(active.liquidity?.usd)}</strong>
            </div>
            <div className="kpi-item">
              <span>FDV</span>
              <strong>{formatUsd(active.fdv)}</strong>
            </div>
            <div className="kpi-item">
              <span>Market Cap</span>
              <strong>{formatUsd(active.marketCap)}</strong>
            </div>
          </div>
        )}

        {/* Security-based Token KPIs */}
        <TokenKPIs 
          data={securityData}
          fdv={active.fdv}
          marketCap={active.marketCap}
        />

        {/* Owner/Creator Metrics */}
        <OwnerMetrics 
          data={securityData}
          chain={chain}
        />

        {/* Price Changes */}
        <div className="kpi-item kpi-wide">
          <span>Price Changes</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {['m5', 'h1', 'h6', 'h24'].map((period, i) => {
              const change = active.priceChange?.[period as keyof typeof active.priceChange];
              const isPositive = change && change > 0;
              const isNegative = change && change < 0;
              
              return (
                <div key={period} style={{ textAlign: 'center', flex: 1 }}>
                  <div 
                    style={{ 
                      color: isPositive ? 'var(--accent-lime)' : isNegative ? 'var(--accent-maroon)' : 'var(--text)',
                      fontWeight: 600
                    }}
                  >
                    {change !== undefined ? `${change.toFixed(2)}%` : '—'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {period === 'm5' ? '5m' : period}
                  </div>
                  {i < 3 && <div style={{ position: 'absolute', right: `${(3-i) * 25}%`, top: '50%', transform: 'translateY(-50%)', width: '1px', height: '60%', background: 'var(--border-subtle)' }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Transactions */}
        <div className="kpi-item kpi-wide">
          <span>Transactions (24h)</span>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <strong>
                {active.txns?.h24 ? (active.txns.h24.buys + active.txns.h24.sells) : '—'}
              </strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TXNS</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--border-subtle)', margin: '0 12px' }} />
            <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {active.txns?.h24 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--accent-lime)', fontWeight: 600 }}>{active.txns.h24.buys}</span>
                    <span style={{ color: 'var(--accent-maroon)', fontWeight: 600 }}>{active.txns.h24.sells}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                    <div style={{ 
                      background: 'var(--accent-lime)', 
                      height: '8px',
                      flex: active.txns.h24.buys,
                      borderRadius: '4px 0 0 4px'
                    }} />
                    <div style={{ 
                      background: 'var(--accent-maroon)', 
                      height: '8px',
                      flex: active.txns.h24.sells,
                      borderRadius: '0 4px 4px 0'
                    }} />
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>—</div>
              )}
            </div>
          </div>
        </div>

        {/* Volume */}
        <div className="kpi-item kpi-wide">
          <span>Volume</span>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {['m5', 'h1', 'h6', 'h24'].map((period, i) => {
              const volume = active.volume?.[period as keyof typeof active.volume];

              // since Argument of type 'string' is not assignable to parameter of type 'number' we must ensure volume is a number 
              const isLargeFormat = volume !== undefined && volume >= 1000000;
              const formattedVolume = isLargeFormat ? formatCompact(volume) : formatSmallPrice(volume);
              const usdFormattedVolume = formatUsd(volume)
              
              return (
                <div key={period} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ color: 'var(--text)', fontWeight: 600 }}>
                    {volume !== undefined ? usdFormattedVolume : '—'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {period === 'm5' ? '5m' : period === 'h1' ? '1h' : period === 'h6' ? '6h' : '24h'}
                  </div>
                  {i < 3 && <div style={{ position: 'absolute', right: `${(3-i) * 25}%`, top: '50%', transform: 'translateY(-50%)', width: '1px', height: '60%', background: 'var(--border-subtle)' }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Security Analysis */}
      <SecurityPanel 
        data={securityData}
        loading={securityLoading}
        error={securityError}
        chain={chain}
        address={address}
      />
    </div>
  );
}
