import React from 'react';
import { formatCompact, formatUsd } from '../lib/format';
import type { ProcessedSecurityData } from '../lib/goplus-types';

interface TokenKPIsProps {
  data: ProcessedSecurityData | null;
}

export function TokenKPIs({ data }: TokenKPIsProps) {
  if (!data) return null;

  const { tokenMetrics } = data;
  
  return (
    <>
      {/* Supply Section - Only show if we have security data */}
      <div className="kpi-item">
        <span>Total Supply</span>
        <strong>{tokenMetrics.totalSupply}</strong>
      </div>

      {/* Transaction Fees Section */}
      {(tokenMetrics.buyTax !== undefined || 
        tokenMetrics.sellTax !== undefined || 
        tokenMetrics.transferTax !== undefined) && (
        <div className="kpi-item">
          <span>TX Fees (B/S/T)</span>
          <strong>
            <span style={{ 
              color: tokenMetrics.buyTax && tokenMetrics.buyTax > 10 ? 'var(--accent-maroon)' : 
                    tokenMetrics.buyTax && tokenMetrics.buyTax > 5 ? 'var(--accent-telegram)' : 'var(--accent-lime)'
            }}>
              {tokenMetrics.buyTax?.toFixed(1) || '0'}%
            </span>
            <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
            <span style={{ 
              color: tokenMetrics.sellTax && tokenMetrics.sellTax > 10 ? 'var(--accent-maroon)' : 
                    tokenMetrics.sellTax && tokenMetrics.sellTax > 5 ? 'var(--accent-telegram)' : 'var(--accent-lime)'
            }}>
              {tokenMetrics.sellTax?.toFixed(1) || '0'}%
            </span>
            <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
            <span style={{ 
              color: tokenMetrics.transferTax && tokenMetrics.transferTax > 5 ? 'var(--accent-maroon)' : 'var(--accent-lime)'
            }}>
              {tokenMetrics.transferTax?.toFixed(1) || '0'}%
            </span>
          </strong>
        </div>
      )}
    </>
  );
}

interface OwnerMetricsProps {
  data: ProcessedSecurityData | null;
  chain: string;
}

export function OwnerMetrics({ data, chain }: OwnerMetricsProps) {
  if (!data || !data.ownerMetrics.ownerAddress || data.ownerMetrics.isRenounced) {
    return null;
  }

  const { ownerMetrics } = data;
  
  return (
    <div className="kpi-item kpi-wide">
      <span>Creator Holdings</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {ownerMetrics.ownerBalance && (
          <div style={{ textAlign: 'center' }}>
            <strong style={{ fontSize: '14px' }}>{ownerMetrics.ownerBalance}</strong>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BALANCE</div>
          </div>
        )}
        {ownerMetrics.ownerPercent && (
          <div style={{ textAlign: 'center' }}>
            <strong 
              style={{ 
                fontSize: '14px',
                color: parseFloat(ownerMetrics.ownerPercent) > 20 ? 'var(--accent-maroon)' : 
                       parseFloat(ownerMetrics.ownerPercent) > 10 ? 'var(--accent-telegram)' : 'var(--text)'
              }}
            >
              {parseFloat(ownerMetrics.ownerPercent).toFixed(1)}%
            </strong>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SUPPLY</div>
          </div>
        )}
      </div>
    </div>
  );
}
