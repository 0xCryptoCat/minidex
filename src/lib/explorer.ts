import type { ChainSlug, Address, TxHash } from './types';

// Blockscan.com provides universal multi-chain support
const BLOCKSCAN_BASE = 'https://blockscan.com';

// Fallback to individual chain explorers if blockscan doesn't support a chain
const BASES = {
  ethereum: 'https://etherscan.io',
  base: 'https://basescan.org',
  arbitrum: 'https://arbiscan.io',
  bsc: 'https://bscscan.com',
  polygon: 'https://polygonscan.com',
  optimism: 'https://optimistic.etherscan.io',
  avalanche: 'https://snowtrace.io',
  // Solana and other non-EVM chains
  solana: 'https://solscan.io',
  sui: 'https://suiexplorer.com',
} as const;

// Chains supported by blockscan.com
const BLOCKSCAN_SUPPORTED = new Set(['ethereum', 'base', 'arbitrum', 'bsc', 'polygon', 'optimism', 'avalanche']);

export function addressUrl(chain: ChainSlug, addr: Address) {
  // Use blockscan.com for supported chains (provides unified interface)
  if (BLOCKSCAN_SUPPORTED.has(chain)) {
    return `${BLOCKSCAN_BASE}/address/${addr}`;
  }
  
  // Fallback to individual chain explorers
  const base = (BASES as Record<string, string>)[chain];
  return base ? `${base}/address/${addr}` : undefined;
}

export function txUrl(chain: ChainSlug, hash: TxHash) {
  // Use blockscan.com for supported chains
  if (BLOCKSCAN_SUPPORTED.has(chain)) {
    return `${BLOCKSCAN_BASE}/tx/${hash}`;
  }
  
  // Fallback to individual chain explorers
  const base = (BASES as Record<string, string>)[chain];
  return base ? `${base}/tx/${hash}` : undefined;
}

export function tokenUrl(chain: ChainSlug, addr: Address) {
  // Use blockscan.com for supported chains
  if (BLOCKSCAN_SUPPORTED.has(chain)) {
    return `${BLOCKSCAN_BASE}/token/${addr}`;
  }
  
  // Fallback to individual chain explorers
  const base = (BASES as Record<string, string>)[chain];
  return base ? `${base}/token/${addr}` : undefined;
}

// backwards compat for older callers
export function explorer(chain: ChainSlug, addr?: Address, tx?: TxHash) {
  return {
    address: addr ? addressUrl(chain, addr) : undefined,
    tx: tx ? txUrl(chain, tx) : undefined,
    token: addr ? tokenUrl(chain, addr) : undefined,
  };
}
