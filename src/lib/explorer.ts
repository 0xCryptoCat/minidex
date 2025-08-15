import type { ChainSlug, Address, TxHash } from './types';

const BASES: Record<string, string> = {
  ethereum: 'https://etherscan.io',
  arbitrum: 'https://arbiscan.io',
  polygon: 'https://polygonscan.com',
  bsc: 'https://bscscan.com',
  base: 'https://basescan.org',
  optimism: 'https://optimistic.etherscan.io',
  avalanche: 'https://snowtrace.io',
};

export function explorer(chain: ChainSlug, addr?: Address, tx?: TxHash) {
  const base = BASES[chain];
  if (!base) return { address: undefined, tx: undefined };
  return {
    address: addr ? `${base}/address/${addr}` : undefined,
    tx: tx ? `${base}/tx/${tx}` : undefined,
  };
}
