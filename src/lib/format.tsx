import type { ReactNode } from 'react';

const formatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 2,
});

export function formatCompact(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) return '-';
  return formatter.format(value);
}

export function formatUsd(
  value?: number,
  opts?: { compact?: boolean; dp?: number }
): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '-';
  const dp = opts?.dp ?? 4;
  if (Math.abs(value) >= 1000 && opts?.compact !== false)
    return `$${formatCompact(value)}`;
  return `$${value.toFixed(dp)}`;
}

export function formatDateTimeUTC(ts?: number): string {
  if (!ts && ts !== 0) return '-';
  const d = new Date(ts * 1000);
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
}

export function formatTimeUTC(ts: number): string {
  const d = new Date(ts * 1000);
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${fmt.format(d)} UTC`;
}

export function formatShortAddr(addr?: string): string {
  if (!addr) return '-';
  return `${addr.slice(0, 2)}…${addr.slice(-4)}`;
}

export function subscriptZeros(frac: string): ReactNode[] {
  return frac.split('').map((c, i) =>
    c === '0' ? (
      <span key={i} className="sub">
        0
      </span>
    ) : (
      c
    )
  );
}

export function formatAmount(value?: number): ReactNode {
  if (value === undefined || value === null || !Number.isFinite(value)) return '-';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1) return value.toFixed(2);

  const str = value.toString();
  if (str.includes('e-')) {
    const [m, e] = str.split('e-');
    const zeros = Number(e) - 1;
    const digits = m.replace('.', '').slice(0, 4);
    return (
      <>
        0.
        {subscriptZeros('0'.repeat(zeros))}
        {digits}
      </>
    );
  }

  const [intPart, fracPartRaw = '0'] = str.split('.');
  const fracPart = fracPartRaw.replace(/0+$/, '');
  const match = fracPart.match(/^(0+)(\d+)/);
  if (match) {
    const [, zeros, rest] = match;
    return (
      <>
        {intPart}.
        {subscriptZeros(zeros)}
        {rest.slice(0, 4)}
      </>
    );
  }
  return `${intPart}.${fracPart.slice(0, 4)}`;
}

export function formatAge(createdTs?: number): string {
  if (!createdTs) return '-';
  const now = Math.floor(Date.now() / 1000);
  let diff = now - createdTs;
  if (diff < 0) diff = 0;
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatTimeAgo(ts?: number): string {
  if (!ts && ts !== 0) return '-';
  const now = Date.now();
  const tradeTime = ts * 1000;
  const diff = now - tradeTime;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

export function formatCompactTime(ts?: number): string {
  if (!ts && ts !== 0) return '-';
  const d = new Date(ts * 1000);
  const now = new Date();
  const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return formatTimeAgo(ts);
  }

  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return `${month} ${day} ${time} UTC`;
}

export function formatSmartAmount(value?: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '-';
  if (value === 0) return '0';

  const abs = Math.abs(value);

  // For very small numbers (< 0.0001), show with subscript zeros
  if (abs < 0.0001 && abs > 0) {
    const str = abs.toString();
    if (str.includes('e-')) {
      const [m, e] = str.split('e-');
      const zeros = Number(e) - 1;
      const digits = m.replace('.', '').slice(0, 4);
      return `0.0{${zeros}}${digits}`;
    }
  }

  // For numbers >= 1000, use compact notation
  if (abs >= 1000) {
    if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  }

  // For numbers >= 1, use 2 decimal places
  if (abs >= 1) return value.toFixed(2);

  // For small numbers, use up to 4 significant digits
  return value.toPrecision(4);
}

export function formatSmallPrice(value?: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '—';
  if (value === 0) return '$0.00';

  // For very small numbers, use subscript notation like 0.0₆32
  if (Math.abs(value) < 0.0001 && Math.abs(value) > 0) {
    const str = value.toString();
    const match = str.match(/0\.0+/);
    if (match) {
      const zeros = match[0].length - 2; // subtract "0."
      const remaining = str.slice(match[0].length);
      const significantDigits = remaining.slice(0, 2);
      return `$0.0₀${zeros}${significantDigits}`;
    }
  }

  if (Math.abs(value) < 1) {
    return `$${value.toFixed(6).replace(/\.?0+$/, '')}`;
  }

  return formatUsd(value);
}

import type { FetchMeta } from './types';
export type { FetchMeta } from './types';

export function formatFetchMeta(meta?: FetchMeta): string | undefined {
  if (!meta) return undefined;
  const parts: string[] = [];
  let reason: string | undefined;
  const tried = meta.tried?.split(',').filter(Boolean);
  if (tried && tried.length > 0) {
    const provs = tried.map((t) => {
      const [p, r] = t.split(':');
      if (r && !reason) reason = `${p}:${r}`;
      return p;
    });
    let base = `Tried: ${provs.join('→')}`;
    if (meta.effectiveTf) base += ` (tf: ${meta.effectiveTf})`;
    parts.push(base);
  } else if (meta.effectiveTf) {
    parts.push(`TF: ${meta.effectiveTf}`);
  }
  if (meta.provider) parts.push(`Provider: ${meta.provider}`);
  if (meta.items) parts.push(`Items: ${meta.items}`);
  if (reason) parts.push(`reason: ${reason}`);
  if (meta.remapped && meta.remapped !== '0') parts.push('remap: yes');
  if (meta.invalidPool) parts.push(`invalid-pool: ${meta.invalidPool}`);
  if (meta.cgAuth) parts.push(`cg-auth: ${meta.cgAuth}`);
  if (meta.token) parts.push(`token: ${meta.token}`);
  if (meta.priceSource) parts.push(`src: ${meta.priceSource}`);
  return parts.join(' | ');
}

