export const CHAIN_TO_GT_NETWORK: Record<string, string> = {
  ethereum: 'eth',
  arbitrum: 'arb',
  base: 'base',
  bsc: 'bsc',
  polygon: 'pos', // Polygon PoS
  avalanche: 'avax',
  optimism: 'op',
  fantom: 'ftm',
  // add more as needed
};
export const SUPPORTED_GT_NETWORKS = new Set(Object.values(CHAIN_TO_GT_NETWORK));
