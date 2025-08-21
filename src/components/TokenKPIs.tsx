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
      {/* Supply Section - Only show if we have security data and total supply */}
      {tokenMetrics.totalSupply && tokenMetrics.totalSupply !== '0' && tokenMetrics.totalSupply !== '0.00' && (
        <div className="kpi-item">
          <span>Total Supply</span>
          <strong>{tokenMetrics.totalSupply}</strong>
        </div>
      )}

      {/* Transaction Fees Section */}
      {(tokenMetrics.buyTax !== undefined || 
        tokenMetrics.sellTax !== undefined || 
        tokenMetrics.transferTax !== undefined) && (
        <div className="kpi-item">
          <span>TXn Fees</span>
          <div style={{ display: 'flex', flexDirection: 'row' , alignItems: 'center', gap: '1px' }}>
            {/* Check if all fees are 0%, if so show single 0% */}
            {(tokenMetrics.buyTax || 0) === 0 && 
             (tokenMetrics.sellTax || 0) === 0 && 
             (tokenMetrics.transferTax || 0) === 0 ? (
              <strong style={{ color: 'var(--text)' }}>0%</strong>
            ) : (
              <>
                <span style={{ color: tokenMetrics.buyTax && tokenMetrics.buyTax > 0 ? 'var(--accent-lime)' : 'var(--text)'}}>{tokenMetrics.buyTax?.toFixed(1) || '0'}%</span>
                <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>|</span>
                <span style={{ color: tokenMetrics.sellTax && tokenMetrics.sellTax > 0 ? 'var(--accent-maroon)' : 'var(--text)'}}>{tokenMetrics.sellTax?.toFixed(1) || '0'}%</span>
                <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>|</span>
                <span style={{ color: 'var(--text)' }}>{tokenMetrics.transferTax?.toFixed(1) || '0'}%</span>
              </>
            )}
          </div>
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
              {ownerMetrics.ownerPercent}%
            </strong>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SUPPLY</div>
          </div>
        )}
      </div>
    </div>
  );
}
