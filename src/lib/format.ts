const formatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 2,
});

export function formatCompact(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) return '-';
  return formatter.format(value);
}
