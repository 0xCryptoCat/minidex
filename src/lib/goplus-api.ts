/**
 * GoPlus Security API Service
 * Handles token security checks across multiple chains
 */

import type { 
  SecurityResponse, 
  GoPlusTokenSecurity, 
  SolanaTokenSecurity,
  SuiTokenSecurity 
} from './goplus-types';

// Chain ID mapping for GoPlus API
export const GOPLUS_CHAIN_MAPPING: Record<string, string> = {
  // Ethereum and EVM chains (use numerical chain IDs)
  '1': '1',           // Ethereum
  '56': '56',         // BSC
  '137': '137',       // Polygon
  '42161': '42161',   // Arbitrum
  '10': '10',         // Optimism
  '8453': '8453',     // Base
  '43114': '43114',   // Avalanche
  '250': '250',       // Fantom
  '25': '25',         // Cronos
  '66': '66',         // OKC
  '128': '128',       // HECO
  '100': '100',       // Gnosis
  '324': '324',       // zkSync Era
  '59144': '59144',   // Linea
  '534352': '534352', // Scroll
  
  // String-based mappings for common names
  'ethereum': '1',
  'bsc': '56',
  'polygon': '137',
  'arbitrum': '42161',
  'optimism': '10',
  'base': '8453',
  'avalanche': '43114',
  'fantom': '250',
  'cronos': '25',
  'gnosis': '100',
  'zksync': '324',
  'linea': '59144',
  'scroll': '534352',
  
  // Special cases
  'solana': 'solana',  // Uses beta API
  'sui': 'sui',        // Uses Sui API
};

// Base URLs for different GoPlus APIs
const GOPLUS_BASE_URL = 'https://api.gopluslabs.io/api/v1';
const GOPLUS_SOLANA_URL = 'https://api.gopluslabs.io/api/v1/solana';
const GOPLUS_SUI_URL = 'https://api.gopluslabs.io/api/v1/sui';

/**
 * Get GoPlus token security data for EVM chains
 */
async function getEVMTokenSecurity(chainId: string, address: string): Promise<GoPlusTokenSecurity | null> {
  try {
    const url = `${GOPLUS_BASE_URL}/token_security/${chainId}?contract_addresses=${address}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 1) {
      throw new Error(data.message || 'GoPlus API error');
    }
    
    // Return the token data (GoPlus returns data keyed by address)
    return data.result?.[address.toLowerCase()] || null;
  } catch (error) {
    console.error('GoPlus EVM API error:', error);
    throw error;
  }
}

/**
 * Get GoPlus token security data for Solana (Beta API)
 */
async function getSolanaTokenSecurity(address: string): Promise<SolanaTokenSecurity | null> {
  try {
    const url = `${GOPLUS_SOLANA_URL}/token_security?contract_addresses=${address}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 1) {
      throw new Error(data.message || 'GoPlus Solana API error');
    }
    
    return data.result?.[address] || null;
  } catch (error) {
    console.error('GoPlus Solana API error:', error);
    throw error;
  }
}

/**
 * Get GoPlus token security data for Sui
 */
async function getSuiTokenSecurity(address: string): Promise<SuiTokenSecurity | null> {
  try {
    const url = `${GOPLUS_SUI_URL}/token_security?contract_addresses=${address}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 1) {
      throw new Error(data.message || 'GoPlus Sui API error');
    }
    
    return data.result?.[address] || null;
  } catch (error) {
    console.error('GoPlus Sui API error:', error);
    throw error;
  }
}

/**
 * Main function to get token security data
 * Automatically routes to the correct API based on chain
 */
export async function getTokenSecurity(chain: string, address: string): Promise<SecurityResponse> {
  const result: SecurityResponse = {
    success: false,
    chain,
    address,
  };

  try {
    // Map chain to GoPlus format
    const goPlusChain = GOPLUS_CHAIN_MAPPING[chain.toLowerCase()];
    
    if (!goPlusChain) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    if (goPlusChain === 'solana') {
      // Use Solana beta API
      const solanaData = await getSolanaTokenSecurity(address);
      if (solanaData) {
        result.success = true;
        result.data = { solana: solanaData };
      }
    } else if (goPlusChain === 'sui') {
      // Use Sui API
      const suiData = await getSuiTokenSecurity(address);
      if (suiData) {
        result.success = true;
        result.data = { sui: suiData };
      }
    } else {
      // Use standard EVM API
      const evmData = await getEVMTokenSecurity(goPlusChain, address);
      if (evmData) {
        result.success = true;
        result.data = { evm: evmData };
      }
    }

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

/**
 * Check if a chain is supported by GoPlus
 */
export function isChainSupported(chain: string): boolean {
  return chain.toLowerCase() in GOPLUS_CHAIN_MAPPING;
}

/**
 * Get the GoPlus chain identifier for a given chain
 */
export function getGoPlusChainId(chain: string): string | null {
  return GOPLUS_CHAIN_MAPPING[chain.toLowerCase()] || null;
}
