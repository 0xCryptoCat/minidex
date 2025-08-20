/**
 * GoPlus Security API Types
 * Based on https://docs.gopluslabs.io/
 */

// LP Locker service mappings
export const LP_LOCKER_MAPPING: Record<string, { name: string; icon?: string }> = {
  'GoPlus SafeToken Locker': { name: 'GoPlus', icon: 'placeholder' },
  'OnlyMoons': { name: 'OnlyMoons', icon: 'placeholder' },
  'PinkLock': { name: 'PinkLock', icon: 'placeholder' },
  'TokenToolLock': { name: 'TokenTool', icon: 'placeholder' },
  'UNCX': { name: 'UNCX', icon: 'placeholder' },
  'DxLock': { name: 'DxLock', icon: 'placeholder' },
  'DaoLock': { name: 'DaoLock', icon: 'placeholder' },
  'Floki': { name: 'Floki', icon: 'placeholder' },
  'TeamFinace': { name: 'TeamFinance', icon: 'placeholder' },
  'PinkLockV2': { name: 'PinkLock V2', icon: 'placeholder' },
  'MapleLocker': { name: 'Maple', icon: 'placeholder' },
  'DeepLock': { name: 'DeepLock', icon: 'placeholder' },
  'MOFO': { name: 'MOFO', icon: 'placeholder' },
  'Mudra': { name: 'Mudra', icon: 'placeholder' },
  'gempad': { name: 'GemPad', icon: 'placeholder' },
  'partyDao': { name: 'PartyDAO', icon: 'placeholder' },
};

// Base holder interface
export interface Holder {
  address: string;
  tag?: string;
  is_contract: '0' | '1';
  balance: string;
  percent: string;
  is_locked: '0' | '1';
  locked_detail?: Array<{
    amount: string;
    end_time: number;
    opt_time: number;
  }>;
}

// LP Holder interface
export interface LPHolder {
  address: string;
  tag?: string;
  value?: string | null;
  is_contract: '0' | '1';
  balance: string;
  percent: string;
  NFT_list?: Array<{
    value: string;
    NFT_id: string;
    amount: string;
    in_effect: boolean;
    NFT_percentage: string;
  }> | null;
  is_locked: '0' | '1';
  locked_detail?: Array<{
    amount: string;
    end_time: number;
    opt_time: number;
  }>;
}

// DEX information interface
export interface DexInfo {
  name: string;
  liquidity: string;
  pair: string;
  liquidity_type?: string;
  pool_manager?: string; // For UniV4 pools
}

// Main GoPlus Token Security Response (EVM chains)
export interface GoPlusTokenSecurity {
  // Security Metrics (0 = false, 1 = true)
  anti_whale_modifiable?: '0' | '1';
  can_take_back_ownership?: '0' | '1';
  cannot_buy?: '0' | '1';
  cannot_sell_all?: '0' | '1';
  external_call?: '0' | '1';
  hidden_owner?: '0' | '1';
  is_anti_whale?: '0' | '1';
  is_blacklisted?: '0' | '1';
  is_honeypot?: '0' | '1';
  is_in_dex?: '0' | '1';
  is_mintable?: '0' | '1';
  is_open_source?: '0' | '1';
  is_proxy?: '0' | '1';
  is_whitelisted?: '0' | '1';
  personal_slippage_modifiable?: '0' | '1';
  selfdestruct?: '0' | '1';
  slippage_modifiable?: '0' | '1';
  transfer_pausable?: '0' | '1';
  trading_cooldown?: '0' | '1';
  
  // Token Metrics
  token_name?: string;
  token_symbol?: string;
  total_supply?: string;
  buy_tax?: string;
  sell_tax?: string;
  transfer_tax?: string;
  
  // Holder Metrics
  holder_count?: string;
  holders?: Holder[];
  
  // Owner/Creator Metrics
  owner_address?: string;
  owner_balance?: string;
  owner_change_balance?: '0' | '1';
  owner_percent?: string;
  creator_address?: string;
  creator_balance?: string;
  creator_percent?: string;
  
  // Liquidity Metrics
  dex?: DexInfo[];
  lp_holder_count?: string;
  lp_holders?: LPHolder[];
  lp_total_supply?: string;
  
  // Additional security flags
  is_airdrop_scam?: '0' | '1';
  trust_list?: '0' | '1';
  fake_token?: {
    value: '0' | '1';
    true_token_address?: string;
  };
  is_in_cex?: {
    listed: '0' | '1';
    cex_list?: string[];
  };
  launchpad_token?: {
    is_launchpad_token: '0' | '1';
    launchpad_name?: string;
  };
  other_potential_risks?: string;
  note?: string;
  gas_abuse?: '0' | '1';
}

// Solana Token Security Response (Beta API)
export interface SolanaTokenSecurity {
  // Security metrics specific to Solana
  freezeable?: '0' | '1';
  mint_authority?: string;
  freeze_authority?: string;
  non_transferable?: '0' | '1';
  
  // Creator and authority info
  creator?: string;
  creator_balance?: string;
  creator_percent?: string;
  
  // Token metrics
  token_name?: string;
  token_symbol?: string;
  total_supply?: string;
  decimals?: number;
  
  // Holder information
  holder_count?: string;
  holders?: Array<{
    account: string;
    balance: string;
    percent: string;
    tag?: string;
    token_account: string;
    is_locked?: '0' | '1';
    locked_detail?: any[];
  }>;
  
  // LP Holder information (for Solana DEX)
  lp_holders?: Array<{
    account: string;
    balance: string;
    percent: string;
    tag?: string;
    token_account: string;
    is_locked?: '0' | '1';
    locked_detail?: Array<{
      amount: string;
      end_time: string;
      opt_time: string;
    }>;
  }>;
  
  // Security checks
  is_open_source?: '0' | '1';
  is_honeypot?: '0' | '1';
  trusted_token?: number;
  
  // Metadata and upgradability
  metadata?: {
    name?: string;
    symbol?: string;
    description?: string;
    uri?: string;
  };
  metadata_mutable?: {
    status: '0' | '1';
    metadata_upgrade_authority: string[];
  };
  mintable?: {
    status: '0' | '1';
    authority: string[];
  };
  transfer_fee?: any;
  transfer_fee_upgradable?: {
    status: '0' | '1';
    authority: string[];
  };
  transfer_hook?: string[];
  transfer_hook_upgradable?: {
    status: '0' | '1';
    authority: string[];
  };
}

// Sui Token Security Response
export interface SuiTokenSecurity {
  // Sui-specific security metrics
  blacklist?: {
    cap_owner: string;
    value: '0' | '1';
  };
  contract_upgradeable?: {
    cap_owner: string;
    value: '0' | '1';
  };
  
  // Token information
  creator?: string;
  decimals?: number;
  total_supply?: string;
  
  // Holder information
  holder_count?: number;
  holders?: Array<{
    address: string;
    balance: string;
    percent: string;
    tag?: string | null;
  }>;
  
  // Additional Sui fields
  [key: string]: any;
}

// Unified security response
export interface SecurityResponse {
  success: boolean;
  data?: {
    evm?: GoPlusTokenSecurity;
    solana?: SolanaTokenSecurity;
    sui?: SuiTokenSecurity;
  };
  error?: string;
  chain: string;
  address: string;
}

// Processed security data for UI
export interface ProcessedSecurityData {
  // Security metrics with boolean values
  securityMetrics: Array<{
    key: string;
    label: string;
    value: boolean;
    critical?: boolean;
  }>;
  
  // Holder insights
  holderMetrics: {
    holderCount: number;
    totalSupply: string;
    topHolders: Array<{
      address: string;
      tag?: string;
      isContract: boolean;
      balance: string;
      percent: string;
      isLocked: boolean;
    }>;
  };
  
  // Liquidity information
  liquidityMetrics: {
    lpHolderCount?: number;
    lpTotalSupply?: string;
    dexes: Array<{
      name: string;
      liquidity: string;
      pair: string;
      liquidityType?: string;
    }>;
    lpHolders: Array<{
      address: string;
      tag?: string;
      isContract: boolean;
      balance: string;
      percent: string;
      isLocked: boolean;
      lockerService?: string;
    }>;
  };
  
  // Owner information
  ownerMetrics: {
    ownerAddress?: string;
    isRenounced: boolean;
    ownerBalance?: string;
    ownerPercent?: string;
    ownerChangeBalance?: boolean;
  };
  
  // Token information
  tokenMetrics: {
    totalSupply: string;
    buyTax?: number;
    sellTax?: number;
    transferTax?: number;
    tokenName?: string;
    tokenSymbol?: string;
  };
  
  // Additional flags
  securityFlags: {
    isAirdropScam?: boolean;
    trustList?: boolean;
    fakeToken?: boolean;
    inCEX?: boolean;
    launchpadToken?: boolean;
    gasAbuse?: boolean;
  };
}

// Helper functions
export function isRenounced(ownerAddress?: string): boolean {
  if (!ownerAddress) return true;
  const nullAddresses = [
    '0x0000000000000000000000000000000000000000',
    '0x000000000000000000000000000000000000dead',
    '0xdead000000000000000042069420694206942069',
    // Solana null address
    '11111111111111111111111111111111',
  ];
  return nullAddresses.includes(ownerAddress.toLowerCase());
}

export function booleanFromString(value: '0' | '1' | undefined): boolean {
  return value === '1';
}

export function parsePercentage(value?: string): number | undefined {
  if (!value) return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num * 100; // Convert to percentage
}

export function parseTaxPercentage(value?: string): number | undefined {
  if (!value) return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num * 100; // Convert to percentage
}
