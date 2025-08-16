// Chain icons mapping
export const CHAIN_ICONS: Record<string, string> = {
  ethereum: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  bsc: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  polygon: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
  arbitrum: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg',
  optimism: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
  avalanche: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  fantom: 'https://assets.coingecko.com/coins/images/4001/large/Fantom.png',
  base: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png', // Placeholder
  solana: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
};

export function getChainIcon(chainId: string): string | undefined {
  return CHAIN_ICONS[chainId.toLowerCase()];
}

// Provider icons mapping
export const PROVIDER_ICONS: Record<string, string> = {
  dexscreener: 'https://dexscreener.com/favicon.ico',
  coingecko: 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
  geckoterminal: 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
  ds: 'https://dexscreener.com/favicon.ico',
  cg: 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
  gt: 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
};

export function getProviderIcon(provider: string): string | undefined {
  return PROVIDER_ICONS[provider.toLowerCase()];
}

// Social icons mapping
export const SOCIAL_ICONS: Record<string, string> = {
  website: '🌐',
  twitter: '𝕏',
  telegram: '✈️', 
  discord: '💬',
  github: '🐙',
  medium: '📝',
  linkedin: '💼',
  facebook: '📘',
  youtube: '📺',
  instagram: '📷',
  reddit: '🔴',
};

export function getSocialIcon(type: string): string {
  return SOCIAL_ICONS[type.toLowerCase()] || '🔗';
}
