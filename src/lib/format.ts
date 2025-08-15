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

