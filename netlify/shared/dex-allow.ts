export const ALLOW = new Set([
  'uniswap_v2',
  'uniswap_v3',
  'sushiswap',
  'pancakeswap_v2',
  'pancakeswap_v3',
  'quickswap',
]);

export function isGtSupported(dex?: string, version?: string): boolean {
  const key = `${(dex || '').toLowerCase()}${version ? '_' + version.toLowerCase() : ''}`;
  return ALLOW.has(key);
}
