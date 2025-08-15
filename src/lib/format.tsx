import type { ReactNode } from 'react';

const formatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 2,
});

export function formatCompact(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) return '-';
  return formatter.format(value);
}

export function formatUsd(value?: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '-';
  if (Math.abs(value) >= 1000) return `$${formatCompact(value)}`;
  return `$${value.toFixed(4)}`;
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

export interface FetchMeta {
  provider?: string | null;
  tried?: string | null;
  effectiveTf?: string | null;
  remapped?: string | null;
  items?: string | null;
  token?: string | null;
  priceSource?: string | null;
}

export function formatFetchMeta(meta?: FetchMeta): string | undefined {
  if (!meta) return undefined;
  const parts: string[] = [];
  const tried = meta.tried?.split(',').filter(Boolean);
  if (tried && tried.length > 0) {
    parts.push(`Tried: ${tried.join('→')}`);
  }
  const extras: string[] = [];
  if (meta.effectiveTf) extras.push(`tf: ${meta.effectiveTf}`);
  if (meta.items) extras.push(`items: ${meta.items}`);
  if (meta.remapped) extras.push(`remap: ${meta.remapped !== '0' ? 'yes' : 'no'}`);
  if (meta.token) extras.push(`token: ${meta.token}`);
  if (meta.priceSource) extras.push(`src: ${meta.priceSource}`);
  if (extras.length > 0) parts.push(`(${extras.join(', ')})`);
  return parts.join(' ');
}

