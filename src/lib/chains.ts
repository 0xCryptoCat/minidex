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

export const CHAIN_TO_ICON: Record<string, string> = {
  ethereum: 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg',
  arbitrum: 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg',
  base: 'https://icons.llamao.fi/icons/chains/rsz_base.jpg',
  bsc: 'https://icons.llamao.fi/icons/chains/rsz_bsc.jpg',
  polygon: 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg',
  avalanche: 'https://icons.llamao.fi/icons/chains/rsz_avalanche.jpg',
  optimism: 'https://icons.llamao.fi/icons/chains/rsz_optimism.jpg',
  fantom: 'https://icons.llamao.fi/icons/chains/rsz_fantom.jpg',
};

export type GTNetwork = typeof CHAIN_TO_GT_NETWORK[keyof typeof CHAIN_TO_GT_NETWORK];

export const SUPPORTED_GT_NETWORKS = new Set<GTNetwork>(
  Object.values(CHAIN_TO_GT_NETWORK)
);

export function toGTNetwork(chain: string): GTNetwork | null {
  return (CHAIN_TO_GT_NETWORK as Record<string, GTNetwork>)[chain] ?? null;
}
