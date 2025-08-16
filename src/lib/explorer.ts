import type { ChainSlug, Address, TxHash } from './types';

const BASES = {
  ethereum: 'https://etherscan.io',
  base: 'https://basescan.org',
  arbitrum: 'https://arbiscan.io',
  bsc: 'https://bscscan.com',
  polygon: 'https://polygonscan.com',
  optimism: 'https://optimistic.etherscan.io',
  avalanche: 'https://snowtrace.io',
} as const;

export function addressUrl(chain: ChainSlug, addr: Address) {
  const base = (BASES as Record<string, string>)[chain];
  return base ? `${base}/address/${addr}` : undefined;
}

export function txUrl(chain: ChainSlug, hash: TxHash) {
  const base = (BASES as Record<string, string>)[chain];
  return base ? `${base}/tx/${hash}` : undefined;
}

// backwards compat for older callers
export function explorer(chain: ChainSlug, addr?: Address, tx?: TxHash) {
  return {
    address: addr ? addressUrl(chain, addr) : undefined,
    tx: tx ? txUrl(chain, tx) : undefined,
  };
}
