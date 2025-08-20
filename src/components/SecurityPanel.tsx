import React, { useState } from 'react';
import { 
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Cancel as CrossIcon,
  AccountBalanceWallet as WalletIcon,
  AccountTree as ContractIcon,
  LockClock as LockIcon,
  ContentCopy as CopyIcon,
  OpenInNew as ExternalIcon,
} from '@mui/icons-material';
import CopyButton from './CopyButton';
import { formatShortAddr } from '../lib/format';
import { addressUrl } from '../lib/explorer';
import type { ProcessedSecurityData } from '../lib/goplus-types';
import { LP_LOCKER_MAPPING } from '../lib/goplus-types';

interface SecurityPanelProps {
  data: ProcessedSecurityData | null;
  loading: boolean;
  error: string | null;
  chain: string;
  address: string;
}

export function SecurityPanel({ data, loading, error, chain, address }: SecurityPanelProps) {
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

  const getSecurityStatus = () => {
    if (loading) return { text: 'Checking...', className: 'pending' };
    if (error) return { text: 'Error', className: 'bad' };
    if (!data) return { text: 'No Data', className: 'pending' };
    
    const criticalIssues = data.securityMetrics.filter(m => m.critical && !m.value);
    if (criticalIssues.length > 0) {
      return { text: `${criticalIssues.length} Critical Issues`, className: 'bad' };
    }
    
    const totalIssues = data.securityMetrics.filter(m => !m.value);
    if (totalIssues.length > 2) {
      return { text: `${totalIssues.length} Issues`, className: 'bad' };
    }
    
    return { text: 'Verified', className: 'good' };
  };

  const status = getSecurityStatus();

  return (
    <div className="security-section">
      <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: '1rem', fontWeight: 600 }}>
        Security Analysis
        {data?.ownerMetrics.isRenounced && (
          <span style={{
            marginLeft: '12px',
            padding: '4px 8px',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            borderRadius: '12px',
            border: '1px solid var(--accent-lime)',
            color: 'var(--accent-lime)',
            background: 'rgba(163, 255, 18, 0.1)'
          }}>
            Renounced
          </span>
        )}
      </h3>
      
      {/* HoneyPot.is Row - Placeholder for future implementation */}
      <div className="security-row">
        <div className="security-name">
          <span>HoneyPot.is</span>
        </div>
        <div className="security-result">
          <span className="security-status pending">Coming Soon</span>
          <button 
            className="security-expand" 
            onClick={() => toggleSection('honeypot')}
            disabled
            style={{ 
              opacity: 0.5,
              cursor: 'not-allowed'
            }}
          >
            <ExpandMoreIcon sx={{ fontSize: 16 }} />
          </button>
        </div>
      </div>
      
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

          {/* Token Metrics */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
              Token Supply
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Supply</span>
              <span style={{ fontWeight: 600 }}>{data.tokenMetrics.totalSupply}</span>
            </div>
          </div>

          {/* Tax Information */}
          {(data.tokenMetrics.buyTax !== undefined || 
            data.tokenMetrics.sellTax !== undefined || 
            data.tokenMetrics.transferTax !== undefined) && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                Transaction Fees
              </h4>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <span style={{ 
                  color: data.tokenMetrics.buyTax && data.tokenMetrics.buyTax > 10 ? 'var(--accent-maroon)' : 
                        data.tokenMetrics.buyTax && data.tokenMetrics.buyTax > 5 ? 'var(--accent-telegram)' : 'var(--accent-lime)'
                }}>
                  {data.tokenMetrics.buyTax?.toFixed(1) || '0'}%
                </span>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ 
                  color: data.tokenMetrics.sellTax && data.tokenMetrics.sellTax > 10 ? 'var(--accent-maroon)' : 
                        data.tokenMetrics.sellTax && data.tokenMetrics.sellTax > 5 ? 'var(--accent-telegram)' : 'var(--accent-lime)'
                }}>
                  {data.tokenMetrics.sellTax?.toFixed(1) || '0'}%
                </span>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ 
                  color: data.tokenMetrics.transferTax && data.tokenMetrics.transferTax > 5 ? 'var(--accent-maroon)' : 'var(--accent-lime)'
                }}>
                  {data.tokenMetrics.transferTax?.toFixed(1) || '0'}%
                </span>
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: 'var(--text-muted)', 
                textAlign: 'center', 
                marginTop: '4px' 
              }}>
                Buy / Sell / Transfer
              </div>
            </div>
          )}

          {/* Owner Information */}
          {data.ownerMetrics.ownerAddress && !data.ownerMetrics.isRenounced && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                Creator
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
                  <ExternalIcon sx={{ fontSize: 12 }} />
                </a>
                {data.ownerMetrics.ownerPercent && (
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '2px 6px', 
                    background: 'var(--bg)', 
                    borderRadius: '4px',
                    color: parseFloat(data.ownerMetrics.ownerPercent) > 10 ? 'var(--accent-maroon)' : 'var(--text-muted)'
                  }}>
                    {parseFloat(data.ownerMetrics.ownerPercent).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Holder Insights Section */}
      {data && (
        <>
          <div className="security-row">
            <div className="security-name">
              <span>Holder Insights</span>
            </div>
            <div className="security-result">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {data.holderMetrics.holderCount.toLocaleString()} holders
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
              <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600 }}>
                Top Holders
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.holderMetrics.topHolders.slice(0, 10).map((holder, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '6px 0',
                    borderBottom: i < 9 ? '1px solid var(--border-subtle)' : 'none'
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', minWidth: '32px' }}>
                      {formatShortAddr(holder.address)}
                    </span>
                    <CopyButton text={holder.address} label="holder address" />
                    <a href={addressUrl(chain as any, holder.address as any)} target="_blank" rel="noopener noreferrer">
                      <ExternalIcon sx={{ fontSize: 10 }} />
                    </a>
                    {holder.tag && (
                      <span style={{ 
                        fontSize: '9px', 
                        padding: '2px 4px', 
                        background: 'var(--bg)', 
                        borderRadius: '3px',
                        color: 'var(--text-muted)'
                      }}>
                        {holder.tag}
                      </span>
                    )}
                    {holder.isContract ? (
                      <ContractIcon sx={{ fontSize: 12, color: 'var(--accent-telegram)' }} />
                    ) : (
                      <WalletIcon sx={{ fontSize: 12, color: 'var(--text-muted)' }} />
                    )}
                    <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{holder.balance}</span>
                    <span style={{ color: 'var(--text-muted)', minWidth: '40px', textAlign: 'right' }}>
                      {parseFloat(holder.percent).toFixed(1)}%
                    </span>
                    {holder.isLocked && (
                      <LockIcon sx={{ fontSize: 12, color: 'var(--accent-lime)' }} />
                    )}
                  </div>
                ))}
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
              <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600 }}>
                DEX Liquidity
              </h4>
              {data.liquidityMetrics.dexes.map((dex, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '4px 0',
                  borderBottom: i < data.liquidityMetrics.dexes.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                }}>
                  <span style={{ fontWeight: 600 }}>{dex.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>${dex.liquidity}</span>
                </div>
              ))}

              {data.liquidityMetrics.lpHolders.length > 0 && (
                <>
                  <h4 style={{ margin: '16px 0 8px 0', fontSize: '12px', fontWeight: 600 }}>
                    LP Holders ({data.liquidityMetrics.lpHolderCount || data.liquidityMetrics.lpHolders.length})
                  </h4>
                  {data.liquidityMetrics.lpHolders.slice(0, 5).map((lpHolder, i) => (
                    <div key={i} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      padding: '4px 0',
                      fontSize: '11px'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {formatShortAddr(lpHolder.address)}
                      </span>
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
                        <LockIcon sx={{ fontSize: 10, color: 'var(--accent-lime)' }} />
                      )}
                      <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
                        {parseFloat(lpHolder.percent).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
