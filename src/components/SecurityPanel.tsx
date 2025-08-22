import React, { useState } from 'react';
import { 
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Cancel as CrossIcon,
  AccountBalanceWallet as WalletIcon,
  AccountTree as ContractIcon,
  LockClock as LockIcon,
  OpenInNew as ExternalIcon,
  Whatshot as WhatshotIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import CopyButton from './CopyButton';
import { formatShortAddr } from '../lib/format';
import { addressUrl } from '../lib/explorer';
import type { ProcessedSecurityData } from '../lib/goplus-types';
import type { ProcessedHoneypotData } from '../lib/honeypot-types';
import { LP_LOCKER_MAPPING } from '../lib/goplus-types';

// Helper function to calculate USD value from raw token balance
function calculateUsdValue(rawBalance: string, priceUsd?: number): string | null {
  if (!priceUsd || !rawBalance || rawBalance === '0') return null;
  
  try {
    const numericBalance = parseFloat(rawBalance);
    if (isNaN(numericBalance) || numericBalance <= 0) return null;
    
    const usdValue = numericBalance * priceUsd;
    
    // Format USD value
    if (usdValue >= 1e6) return `$${(usdValue / 1e6).toFixed(1)}M`;
    if (usdValue >= 1e3) return `$${(usdValue / 1e3).toFixed(1)}K`;
    if (usdValue >= 1) return `$${usdValue.toFixed(0)}`;
    if (usdValue >= 0.01) return `$${usdValue.toFixed(2)}`;
    return `$${usdValue.toFixed(4)}`;
  } catch {
    return null;
  }
}

interface SecurityPanelProps {
  data: ProcessedSecurityData | null;
  honeypotData: ProcessedHoneypotData | null;
  loading: boolean;
  honeypotLoading: boolean;
  error: string | null;
  honeypotError: string | null;
  chain: string;
  address: string;
  tokenPriceUsd?: number;
}

export function SecurityPanel({ data, honeypotData, loading, honeypotLoading, error, honeypotError, chain, address, tokenPriceUsd }: SecurityPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusIcon = (value: boolean, critical?: boolean) => {
    if (value) {
      return <CheckIcon sx={{ fontSize: 16, color: 'var(--accent-lime)' }} />;
    } else {
      const color = critical ? 'var(--accent-maroon)' : 'var(--text-muted)';
      return <CrossIcon sx={{ fontSize: 16, color }} />;
    }
  };

  const getHoneypotStatus = () => {
    if (honeypotLoading) return { text: 'Checking...', className: 'pending' };
    if (honeypotError || !honeypotData) return { text: 'Unavailable', className: 'pending' };
    if (!honeypotData.available) return { text: 'Unavailable', className: 'pending' };
    
    if (honeypotData.isHoneypot) {
      return { text: 'Honeypot Detected', className: 'bad' };
    }
    
    // Use risk level for status
    switch (honeypotData.risk.level) {
      case 'very_low': return { text: 'Very Low Risk', className: 'good' };
      case 'low': return { text: 'Low Risk', className: 'good' };
      case 'medium': return { text: 'Medium Risk', className: 'warning' };
      case 'high': return { text: 'High Risk', className: 'bad' };
      case 'very_high': return { text: 'Very High Risk', className: 'bad' };
      case 'honeypot': return { text: 'Honeypot', className: 'bad' };
      case 'unknown':
      default: return { text: 'Unknown Risk', className: 'pending' };
    }
  };

  const getSecurityStatus = () => {
    if (loading) return { text: 'Checking...', className: 'pending' };
    if (error) return { text: 'Error', className: 'bad' };
    if (!data) return { text: 'No Data', className: 'pending' };
    
    const criticalIssues = data.securityMetrics.filter(m => m.critical && !m.value);
    if (criticalIssues.length > 0) {
      return { text: `${criticalIssues.length} Critical Issues`, className: 'bad' };
    }
    
    const totalIssues = data.securityMetrics.filter(m => !m.value);
    
    // "Mild Issues" for non-critical but non-verified states
    if (totalIssues.length > 5) {
      return { text: `${totalIssues.length} Issues`, className: 'bad' };
    } else if (totalIssues.length > 2) {
      return { text: `${totalIssues.length} Mild Issues`, className: 'warning' };
    } else if (totalIssues.length > 0) {
      return { text: `${totalIssues.length} Minor Issues`, className: 'warning' };
    }
    
    return { text: 'Verified', className: 'good' };
  };

  const status = getSecurityStatus();
  const honeypotStatus = getHoneypotStatus();

  const nullAddresses = [
    '0x0000000000000000000000000000000000000000',
    '0x000000000000000000000000000000000000dead',
    '0xdead000000000000000042069420694206942069',
  ];

  return (
    <div className="security-section">
      <h3 className="security-title">
        Security Analysis
        {data?.ownerMetrics.isRenounced && (
          <span style={{
            marginLeft: '12px',
            padding: '4px 8px',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'lowercase',
            borderRadius: '12px',
            border: '1px solid var(--accent-lime)',
            color: 'var(--accent-lime)',
            background: 'rgba(163, 255, 18, 0)'
          }}>
            Renounced
          </span>
        )}
      </h3>
      
      {/* HoneyPot.is Row */}
      <div className="security-row">
        <div className="security-name">
          <span>HoneyPot.is</span>
        </div>
        <div className="security-result">
          <span className={`security-status ${honeypotStatus.className}`}>
            {honeypotStatus.text}
          </span>
          <button 
            className="security-expand" 
            onClick={() => toggleSection('honeypot')}
            disabled={!honeypotData?.available}
            style={{ 
              opacity: honeypotData?.available ? 1 : 0.5,
              cursor: honeypotData?.available ? 'pointer' : 'not-allowed',
              transform: (expandedSections.honeypot && honeypotData?.available) ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            <ExpandMoreIcon sx={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      {/* Expanded HoneyPot.is Details */}
      {expandedSections.honeypot && honeypotData?.available && (
        <div style={{ 
          background: 'var(--bg-elev)', 
          margin: '8px 0', 
          borderRadius: '8px', 
          padding: '16px',
          fontSize: '13px'
        }}>
          {/* Risk Level and Flags */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
              Risk Assessment
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600 }}>{honeypotData.risk.description}</span>
              {honeypotData.risk.score !== undefined && (
                <span style={{ 
                  fontSize: '11px', 
                  padding: '2px 6px', 
                  background: honeypotData.risk.score > 60 ? 'var(--accent-maroon)' : 
                             honeypotData.risk.score > 20 ? 'var(--accent-telegram)' : 'var(--accent-lime)', 
                  color: 'var(--bg)',
                  borderRadius: '4px',
                  fontWeight: 600
                }}>
                  {honeypotData.risk.score}/100
                </span>
              )}
            </div>
            
            {/* Risk Flags */}
            {honeypotData.flags && honeypotData.flags.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                {honeypotData.flags.map((flag, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '11px'
                  }}>
                    <WarningIcon sx={{ 
                      fontSize: 12, 
                      color: flag.severity === 'critical' ? 'var(--accent-maroon)' :
                             flag.severity === 'high' ? 'var(--warning)' :
                             flag.severity === 'medium' ? 'var(--accent-telegram)' : 'var(--text-muted)'
                    }} />
                    <span style={{ color: 'var(--text-muted)' }}>{flag.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transaction Taxes */}
          {(honeypotData.taxes.buy > 0 || honeypotData.taxes.sell > 0 || honeypotData.taxes.transfer > 0) && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                Transaction Taxes
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: honeypotData.taxes.buy > 10 ? 'var(--accent-maroon)' : 'var(--text)' }}>
                    {honeypotData.taxes.buy.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BUY</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: honeypotData.taxes.sell > 10 ? 'var(--accent-maroon)' : 'var(--text)' }}>
                    {honeypotData.taxes.sell.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SELL</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: honeypotData.taxes.transfer > 10 ? 'var(--accent-maroon)' : 'var(--text)' }}>
                    {honeypotData.taxes.transfer.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TRANSFER</div>
                </div>
              </div>
            </div>
          )}

          {/* Max Buy/Sell Limits */}
          {honeypotData.limits && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                Transaction Limits
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {honeypotData.limits.maxBuy && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Max Buy</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>{honeypotData.limits.maxBuy.formattedValue}</div>
                      {honeypotData.limits.maxBuy.percentage > 0 && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {honeypotData.limits.maxBuy.percentage.toFixed(2)}% of supply
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {honeypotData.limits.maxSell && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Max Sell</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>{honeypotData.limits.maxSell.formattedValue}</div>
                      {honeypotData.limits.maxSell.percentage > 0 && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {honeypotData.limits.maxSell.percentage.toFixed(2)}% of supply
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contract Information */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
              Contract Info
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Open Source</span>
                {getStatusIcon(honeypotData.contractInfo.openSource)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Proxy Contract</span>
                {getStatusIcon(!honeypotData.contractInfo.isProxy)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Go+ Security Row */}
      <div className="security-row">
        <div className="security-name">
          <span>Go+ Security</span>
        </div>
        <div className="security-result">
          <span className={`security-status ${status.className}`}>
            {status.text}
          </span>
          <button 
            className="security-expand" 
            onClick={() => toggleSection('goplus')}
            style={{ 
              transform: expandedSections.goplus ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            <ExpandMoreIcon sx={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      {/* Expanded Go+ Security Details */}
      {expandedSections.goplus && data && (
        <div style={{ 
          background: 'var(--bg-elev)', 
          margin: '8px 0', 
          borderRadius: '8px', 
          padding: '16px',
          fontSize: '13px'
        }}>
          {/* Security Metrics Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px',
            marginBottom: '16px'
          }}>
            {data.securityMetrics.map(metric => (
              <div key={metric.key} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '4px 0'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>{metric.label}</span>
                {getStatusIcon(metric.value, metric.critical)}
              </div>
            ))}
          </div>

          {/* Creator Holdings - only show when meaningful data exists */}
          {data.ownerMetrics.ownerAddress && !data.ownerMetrics.isRenounced && 
           ((data.ownerMetrics.ownerPercent && data.ownerMetrics.ownerPercent !== '' && parseFloat(data.ownerMetrics.ownerPercent) > 0) || 
            (data.ownerMetrics.ownerBalance && data.ownerMetrics.ownerBalance !== '' && data.ownerMetrics.ownerBalance !== '0')) && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                Creator Holdings
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  {formatShortAddr(data.ownerMetrics.ownerAddress)}
                </span>
                <CopyButton text={data.ownerMetrics.ownerAddress} label="owner address" />
                <a 
                  href={addressUrl(chain as any, data.ownerMetrics.ownerAddress as any)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalIcon sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                </a>
                {data.ownerMetrics.ownerPercent && (
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '2px 6px', 
                    background: 'var(--bg)', 
                    borderRadius: '4px',
                    color: parseFloat(data.ownerMetrics.ownerPercent) > 10 ? 'var(--accent-maroon)' : 'var(--text-muted)'
                  }}>
                    {data.ownerMetrics.ownerPercent}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Holder Insights Section */}
      {((data && data.holderMetrics.holderCount > 0) || (honeypotData?.totalHolders && honeypotData.totalHolders > 0)) && (
        <>
          <div className="security-row">
            <div className="security-name">
              <span>Holder Insights</span>
            </div>
            <div className="security-result">
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                {(data?.holderMetrics.holderCount || honeypotData?.totalHolders || 0).toLocaleString()} Holders
              </span>
              <button 
                className="security-expand" 
                onClick={() => toggleSection('holders')}
                style={{ 
                  transform: expandedSections.holders ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          </div>

          {/* Expanded Holder Details */}
          {expandedSections.holders && (
            <div style={{ 
              background: 'var(--bg-elev)', 
              margin: '8px 0', 
              borderRadius: '8px', 
              padding: '16px',
              fontSize: '12px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 400, color: 'var(--muted)', textTransform: 'uppercase' }}>
                Top 10 Holders
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data?.holderMetrics.topHolders && data.holderMetrics.topHolders.length > 0 ? (
                  data.holderMetrics.topHolders.slice(0, 10).map((holder, i) => (
                    <div key={i} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        padding: '6px 0',
                        borderBottom: i < 9 ? '1px solid var(--border-subtle)' : 'none'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                          <code style={{ color: 'var(--text-muted)', fontSize: '12px', minWidth: '32px' }}>
                          {formatShortAddr(holder.address)}
                          </code>
                          {holder.tag && (
                            <span style={{ 
                                fontSize: '10px', 
                                color: 'var(--text-disabled)',
                            }}>
                                {holder.tag}
                            </span>
                          )}
                        </div>
                        <CopyButton text={holder.address} label="holder address" />
                        <a href={addressUrl(chain as any, holder.address as any)} target="_blank" rel="noopener noreferrer">
                        <ExternalIcon sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                        </a>
                        {holder.isContract ? (
                        <ContractIcon sx={{ fontSize: 14, color: 'var(--warning)' }} />
                        ) : (
                        <WalletIcon sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                        )}
                        <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{holder.balance}</span>
                        {tokenPriceUsd && holder.rawBalance && calculateUsdValue(holder.rawBalance, tokenPriceUsd) && (
                            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
                              ({calculateUsdValue(holder.rawBalance, tokenPriceUsd)})
                            </span>
                        )}
                        <span style={{ color: 'var(--text-muted)', minWidth: '40px', textAlign: 'right' }}>
                        {(parseFloat(holder.percent) < 1 ? (parseFloat(holder.percent) * 100).toFixed(2) : parseFloat(holder.percent).toFixed(2))}%
                        </span>
                        {holder.isLocked && (
                        <LockIcon sx={{ fontSize: 14, color: 'var(--accent-lime)' }} />
                        )}
                    </div>
                    )
                  )
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {honeypotData?.totalHolders 
                      ? `${honeypotData.totalHolders.toLocaleString()} holders (detailed breakdown not available)`
                      : 'No holder data available'}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Liquidity Section */}
      {data && data.liquidityMetrics.dexes.length > 0 && (
        <>
          <div className="security-row">
            <div className="security-name">
              <span>Liquidity Analysis</span>
            </div>
            <div className="security-result">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {data.liquidityMetrics.dexes.length} DEX{data.liquidityMetrics.dexes.length !== 1 ? 'es' : ''}
              </span>
              <button 
                className="security-expand" 
                onClick={() => toggleSection('liquidity')}
                style={{ 
                  transform: expandedSections.liquidity ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          </div>

          {expandedSections.liquidity && (
            <div style={{ 
              background: 'var(--bg-elev)', 
              margin: '8px 0', 
              borderRadius: '8px', 
              padding: '16px',
              fontSize: '12px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 400, color: 'var(--muted)', textTransform: 'uppercase' }}>
                DEX Liquidity
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.liquidityMetrics.dexes.map((dex, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '6px 0',
                    borderBottom: i < data.liquidityMetrics.dexes.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                  }}>
                    <span style={{ fontWeight: 600, flex: 1 }}>{dex.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>${dex.liquidity}</span>
                  </div>
                ))}
              </div>

              {data.liquidityMetrics.lpHolders.length > 0 && (
                <>
                  <h4 style={{ margin: '16px 0 8px 0', fontSize: '12px', fontWeight: 400, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    LP Holders ({data.liquidityMetrics.lpHolderCount || data.liquidityMetrics.lpHolders.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.liquidityMetrics.lpHolders.slice(0, 10).map((lpHolder, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        padding: '6px 0',
                        borderBottom: i < Math.min(9, data.liquidityMetrics.lpHolders.length - 1) ? '1px solid var(--border-subtle)' : 'none'
                      }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', minWidth: '32px' }}>
                          {formatShortAddr(lpHolder.address)}
                        </span>
                        <CopyButton text={lpHolder.address} label="LP holder address" />
                        <a href={addressUrl(chain as any, lpHolder.address as any)} target="_blank" rel="noopener noreferrer">
                          <ExternalIcon sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                        </a>
                        {lpHolder.tag && (
                          <span style={{ 
                            fontSize: '10px', 
                            padding: '2px 6px', 
                            border: '1px solid var(--bg-elev-2)', 
                            borderRadius: '15px',
                            color: 'var(--text-muted)'
                          }}>
                            {lpHolder.tag}
                          </span>
                        )}
                        {nullAddresses.includes(lpHolder.address) && lpHolder.balance > '0' && (
                          <WhatshotIcon sx={{ fontSize: 14, color: 'var(--warning)' }} />
                        )}
                        {lpHolder.lockerService && LP_LOCKER_MAPPING[lpHolder.lockerService] && (
                          <span style={{ 
                            fontSize: '9px', 
                            padding: '2px 4px', 
                            background: 'var(--accent-lime)', 
                            color: 'var(--bg)',
                            borderRadius: '3px',
                            fontWeight: 600
                          }}>
                            {LP_LOCKER_MAPPING[lpHolder.lockerService].name}
                          </span>
                        )}
                        {lpHolder.isLocked && (
                          <LockIcon sx={{ fontSize: 14, color: 'var(--accent-lime)' }} />
                        )}
                        {lpHolder.balance && (
                          <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{lpHolder.balance}</span>
                        )}
                        <span style={{ color: 'var(--text-muted)', minWidth: '40px', textAlign: 'right' }}>
                          {(parseFloat(lpHolder.percent) < 1 ? (parseFloat(lpHolder.percent) * 100).toFixed(2) : parseFloat(lpHolder.percent).toFixed(2))}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
