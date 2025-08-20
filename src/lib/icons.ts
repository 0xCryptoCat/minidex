/**
 * Comprehensive chain and DEX icons system for SmallDEX
 * Supports all networks and DEXes from GeckoTerminal integration
 * Auto-generated from Coingecko data
 */

// Import the generated icons data
import iconsData from './icons-data.json';

// Chain icons mapping - comprehensive list covering all networks
export const CHAIN_ICONS: Record<string, string> = {
  ...iconsData.chains,
  // Fallback/unknown
  unknown: 'https://placehold.co/24x24/6366f1/ffffff?text=?',
};

// DEX icons mapping - comprehensive list from Coingecko
export const DEX_ICONS: Record<string, string> = {
  ...iconsData.dexes,
  // Default fallback
  unknown: 'https://placehold.co/24x24/6366f1/ffffff?text=DEX',
};

// Helper functions
export function getChainIcon(chainId: string): string {
  return CHAIN_ICONS[chainId.toLowerCase()] || CHAIN_ICONS.unknown;
}

export function getDexIcon(dexId: string): string {
  // Try exact match first (for both names and numeric IDs)
  const exactMatch = DEX_ICONS[dexId.toLowerCase()];
  if (exactMatch) return exactMatch;
  
  // Try to handle common variations
  const cleanDexId = dexId.toLowerCase()
    .replace(/[-_]/g, '') // Remove hyphens and underscores
    .replace(/\s+/g, ''); // Remove spaces
    
  const variationMatch = DEX_ICONS[cleanDexId];
  if (variationMatch) return variationMatch;
  
  // Try with common prefixes/suffixes removed
  const withoutVersion = dexId.toLowerCase().replace(/[-_]?v[0-9]+$/i, '');
  const versionMatch = DEX_ICONS[withoutVersion];
  if (versionMatch) return versionMatch;
  
  return DEX_ICONS.unknown;
}

export function getProviderIcon(provider: string): string {
  const PROVIDER_ICONS: Record<string, string> = {
    dexscreener: 'https://dexscreener.com/favicon.ico',
    coingecko: 'https://www.coingecko.com/favicon.ico', // this is sushiswap icon
    geckoterminal: 'https://www.geckoterminal.com/favicon.ico', // this is sushiswap icon
    ds: 'https://dexscreener.com/favicon.ico',
    cg: 'https://www.coingecko.com/favicon.ico', // this is sushiswap icon
    gt: 'https://www.geckoterminal.com/favicon.ico', // this is sushiswap icon
    synthetic: '🔄',
    none: '❓',
  };
  
  return PROVIDER_ICONS[provider.toLowerCase()] || '❓';
}

// Icon component props helpers
export interface IconProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function createIconProps(src: string, alt: string, size = 20): IconProps {
  return {
    src,
    alt,
    size,
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      objectFit: 'cover',
    }
  };
}
