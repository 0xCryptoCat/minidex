import type { ChainSlug, Address, TxHash } from './types';

const BASES: Record<string, string> = {
  ethereum: 'https://etherscan.io',
  bsc: 'https://bscscan.com',
  base: 'https://basescan.org',
  arbitrum: 'https://arbiscan.io',
  polygon: 'https://polygonscan.com',
  optimism: 'https://optimistic.etherscan.io',
  avalanche: 'https://snowtrace.io',
};

export function addressUrl(chain: ChainSlug, addr: Address) {
  const base = BASES[chain];
  return base ? `${base}/address/${addr}` : undefined;
}

export function txUrl(chain: ChainSlug, hash: TxHash) {
  const base = BASES[chain];
  return base ? `${base}/tx/${hash}` : undefined;
}

// backwards compat for older callers
export function explorer(chain: ChainSlug, addr?: Address, tx?: TxHash) {
  return {
    address: addr ? addressUrl(chain, addr) : undefined,
    tx: tx ? txUrl(chain, tx) : undefined,
  };
}
