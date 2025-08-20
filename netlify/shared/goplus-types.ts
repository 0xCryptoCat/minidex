/**
 * Shared GoPlus Security API Types for Netlify Functions
 * Based on https://docs.gopluslabs.io/
 */

// Chain ID mappings for GoPlus
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
  
  // String-based mappings for common names
  'ethereum': '1',
  'bsc': '56',
  'polygon': '137',
  'arbitrum': '42161',
  'optimism': '10',
  'base': '8453',
  'avalanche': '43114',
  'fantom': '250',
  
  // Special cases
  'solana': 'solana',  // Uses beta API
  'sui': 'sui',        // Future support
};

// Unified security response
export interface SecurityResponse {
  success: boolean;
  data?: {
    evm?: any;
    solana?: any;
    sui?: any;
  };
  error?: string;
  chain: string;
  address: string;
}
