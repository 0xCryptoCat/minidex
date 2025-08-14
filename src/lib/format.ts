const formatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 2,
});

export function formatCompact(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) return '-';
  return formatter.format(value);
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
  tried?: string | null;
  effectiveTf?: string | null;
  remapped?: string | null;
}

export function formatFetchMeta(meta?: FetchMeta): string | undefined {
  if (!meta) return undefined;
  const parts: string[] = [];
  const tried = meta.tried?.split(',').filter(Boolean);
  if (tried && tried.length > 0) {
    parts.push(`Tried: ${tried.join(' → ')}`);
  }
  const extras: string[] = [];
  if (meta.effectiveTf) extras.push(`effective TF: ${meta.effectiveTf}`);
  if (meta.remapped && meta.remapped !== '0') extras.push('remapped: yes');
  if (extras.length > 0) {
    parts.push(`(${extras.join('; ')})`);
  }
  return parts.join(' ');
}

