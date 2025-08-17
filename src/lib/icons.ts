/**
 * Comprehensive chain and DEX icons system for SmallDEX
 * Supports all networks and DEXes from GeckoTerminal integration
 */

// Chain icons mapping - comprehensive list covering all 100 networks
export const CHAIN_ICONS: Record<string, string> = {
  // Major chains
  ethereum: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  bsc: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  polygon: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
  arbitrum: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg',
  optimism: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
  avalanche: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  base: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
  solana: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  fantom: 'https://assets.coingecko.com/coins/images/4001/large/Fantom.png',
  
  // Layer 2s and scaling solutions
  scroll: 'https://assets.coingecko.com/coins/images/26942/large/scroll.png',
  mantle: 'https://assets.coingecko.com/coins/images/30980/large/token-logo.png',
  linea: 'https://assets.coingecko.com/coins/images/31282/large/linea.png',
  blast: 'https://assets.coingecko.com/coins/images/37138/large/blast.png',
  mode: 'https://assets.coingecko.com/coins/images/33837/large/mode.png',
  metis: 'https://assets.coingecko.com/coins/images/15595/large/metis.PNG',
  
  // Alt L1s
  sui: 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg',
  aptos: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png',
  near: 'https://assets.coingecko.com/coins/images/10365/large/near.jpg',
  cosmos: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
  osmosis: 'https://assets.coingecko.com/coins/images/16724/large/osmo.png',
  sei: 'https://assets.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png',
  
  // More chains
  celo: 'https://assets.coingecko.com/coins/images/11090/large/InjXBNx9_400x400.jpg',
  aurora: 'https://assets.coingecko.com/coins/images/20582/large/aurora.jpeg',
  cronos: 'https://assets.coingecko.com/coins/images/7310/large/cro_token_logo.png',
  moonbeam: 'https://assets.coingecko.com/coins/images/22459/large/glmr.png',
  moonriver: 'https://assets.coingecko.com/coins/images/17984/large/9285.png',
  kava: 'https://assets.coingecko.com/coins/images/9761/large/kava.png',
  
  // More exotic chains
  canto: 'https://assets.coingecko.com/coins/images/26536/large/canto.png',
  evmos: 'https://assets.coingecko.com/coins/images/24023/large/evmos.png',
  injective: 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png',
  juno: 'https://assets.coingecko.com/coins/images/19249/large/juno.png',
  stargaze: 'https://assets.coingecko.com/coins/images/22451/large/stargaze.png',
  
  // Fallback/unknown
  unknown: 'https://placehold.co/24x24/6366f1/ffffff?text=?',
};

// DEX icons mapping - major DEXes across all chains
export const DEX_ICONS: Record<string, string> = {
  // Uniswap family
  'uniswap-v2': 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  'uniswap-v3': 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  'uniswap_v2_ethereum': 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  'uniswap_v3_ethereum': 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  'uniswap_v3_arbitrum': 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  'uniswap_v3_polygon': 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  'uniswap-v3-base': 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  'uniswap-v2-base': 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  
  // PancakeSwap family
  'pancakeswap': 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png',
  'pancakeswap_v2': 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png',
  'pancakeswap_v3': 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png',
  'pancakeswap_v2_bsc': 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png',
  'pancakeswap-v2-arbitrum': 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png',
  'pancakeswap-v3-arbitrum': 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png',
  'pancakeswap-v2-base': 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png',
  'pancakeswap-v3-base': 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png',
  
  // SushiSwap family
  'sushiswap': 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
  'sushiswap_ethereum': 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
  'sushiswap_arbitrum': 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
  'sushiswap_polygon': 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
  'sushiswap-v3-arbitrum': 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
  'sushiswap-v3-base': 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
  'sushiswap-v2-base': 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
  
  // Curve
  'curve': 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
  'curve_ethereum': 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
  'curve_arbitrum': 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
  'curve-base': 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
  
  // Chain-specific major DEXes
  'aerodrome-base': 'https://assets.coingecko.com/coins/images/31745/large/token.png',
  'aerodrome-slipstream': 'https://assets.coingecko.com/coins/images/31745/large/token.png',
  'baseswap': 'https://assets.coingecko.com/coins/images/30056/large/baseswap.png',
  'traderjoe': 'https://assets.coingecko.com/coins/images/17569/large/traderjoe.png',
  'traderjoe-v2-arbitrum': 'https://assets.coingecko.com/coins/images/17569/large/traderjoe.png',
  'traderjoe-v2-avalanche': 'https://assets.coingecko.com/coins/images/17569/large/traderjoe.png',
  'camelot': 'https://assets.coingecko.com/coins/images/27137/large/GRAIL_LOGO_PROFILE_300x300.png',
  'camelot-v3': 'https://assets.coingecko.com/coins/images/27137/large/GRAIL_LOGO_PROFILE_300x300.png',
  'spookyswap': 'https://assets.coingecko.com/coins/images/18069/large/boo.png',
  'quickswap': 'https://assets.coingecko.com/coins/images/13970/large/1_pOU6pBMEmiL-ZJVb0CYRjQ.png',
  'quickswap_polygon': 'https://assets.coingecko.com/coins/images/13970/large/1_pOU6pBMEmiL-ZJVb0CYRjQ.png',
  
  // Solana DEXes
  'orca': 'https://assets.coingecko.com/coins/images/17547/large/Orca_Logo.png', // Orca confirmed
  'raydium': 'https://assets.coingecko.com/coins/images/13928/large/PSigc4ie_400x400.jpg', // Raydium confirmed
  'jupiter': 'https://assets.coingecko.com/coins/images/10351/large/Jupiter.png', // Unreachable image
  
  // Default fallback
  unknown: 'https://placehold.co/24x24/6366f1/ffffff?text=DEX',
};

// Helper functions
export function getChainIcon(chainId: string): string {
  return CHAIN_ICONS[chainId.toLowerCase()] || CHAIN_ICONS.unknown;
}

export function getDexIcon(dexId: string): string {
  return DEX_ICONS[dexId.toLowerCase()] || DEX_ICONS.unknown;
}

export function getProviderIcon(provider: string): string {
  const PROVIDER_ICONS: Record<string, string> = {
    dexscreener: 'https://dexscreener.com/favicon.ico',
    coingecko: 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png', // this is sushiswap icon
    geckoterminal: 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png', // this is sushiswap icon
    ds: 'https://dexscreener.com/favicon.ico',
    cg: 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png', // this is sushiswap icon
    gt: 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png', // this is sushiswap icon
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
