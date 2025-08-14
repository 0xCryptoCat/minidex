export const CHAIN_TO_GT_NETWORK = {
  ethereum: 'eth',
  arbitrum: 'arb',
  base: 'base',
  bsc: 'bsc',
  polygon: 'pos', // Polygon PoS
  avalanche: 'avax',
  optimism: 'op',
  fantom: 'ftm',
  // add more as needed
} as const;

export type GTNetwork = typeof CHAIN_TO_GT_NETWORK[keyof typeof CHAIN_TO_GT_NETWORK];

export const SUPPORTED_GT_NETWORKS = new Set<GTNetwork>(
  Object.values(CHAIN_TO_GT_NETWORK)
);

export function toGTNetwork(chain: string): GTNetwork | null {
  return (CHAIN_TO_GT_NETWORK as Record<string, GTNetwork>)[chain] ?? null;
}
