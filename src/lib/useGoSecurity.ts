import { useState, useEffect, useMemo } from 'react';
import type { 
  SecurityResponse, 
  ProcessedSecurityData, 
  GoPlusTokenSecurity, 
  SolanaTokenSecurity,
  SuiTokenSecurity,
  Holder,
  LPHolder 
} from './goplus-types';

// Security metric labels and descriptions
const SECURITY_METRICS_CONFIG: Record<string, { label: string; critical: boolean; invert?: boolean }> = {
  is_honeypot: { label: 'Honeypot Check', critical: true, invert: true },
  is_blacklisted: { label: 'Blacklist Check', critical: true, invert: true },
  cannot_buy: { label: 'Can Buy', critical: true, invert: true },
  cannot_sell_all: { label: 'Can Sell', critical: true, invert: true },
  is_open_source: { label: 'Open Source', critical: false },
  is_proxy: { label: 'Proxy Contract', critical: false },
  is_mintable: { label: 'Mintable', critical: false },
  external_call: { label: 'External Calls', critical: true, invert: true },
  selfdestruct: { label: 'Self Destruct', critical: true, invert: true },
  is_anti_whale: { label: 'Anti-Whale', critical: false },
  anti_whale_modifiable: { label: 'Modded Anti-Whale', critical: true, invert: true },
  slippage_modifiable: { label: 'Modded Slippage', critical: true, invert: true },
  personal_slippage_modifiable: { label: 'Personal Slippage', critical: true, invert: true },
  can_take_back_ownership: { label: 'Reclaim Ownership', critical: true, invert: true },
  hidden_owner: { label: 'Hidden Owner', critical: true, invert: true },
  is_whitelisted: { label: 'Whitelisted', critical: false },
  is_in_dex: { label: 'In DEX', critical: false },
  trading_cooldown: { label: 'Trading Cooldown', critical: false, invert: true },
  transfer_pausable: { label: 'Transfer Pausable', critical: true, invert: true },
};

export function useGoSecurity(chain: string, address: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SecurityResponse | null>(null);

  const apiUrl = useMemo(() => {
    if (!chain || !address) return null;
    const baseUrl = '/.netlify/functions/security';
    const params = new URLSearchParams({ chain, address });
    return `${baseUrl}?${params}`;
  }, [chain, address]);

  useEffect(() => {
    if (!apiUrl) return;

    let abortController = new AbortController();
    
    const fetchSecurity = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(apiUrl, {
          signal: abortController.signal,
          credentials: 'omit',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result: SecurityResponse = await response.json();
        
        if (!abortController.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch security data');
          setData(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchSecurity();

    return () => {
      abortController.abort();
    };
  }, [apiUrl]);

  const processedData = useMemo(() => {
    if (!data?.success || !data.data) return null;
    
    if (data.data.evm) {
      return processEVMSecurityData(data.data.evm);
    } else if (data.data.solana) {
      return processSolanaSecurityData(data.data.solana);
    } else if (data.data.sui) {
      return processSuiSecurityData(data.data.sui);
    }
    
    return null;
  }, [data]);

  return {
    loading,
    error,
    data: processedData,
    raw: data,
  };
}

function booleanFromString(value: '0' | '1' | undefined): boolean {
  return value === '1';
}

function isRenounced(ownerAddress?: string): boolean {
  if (!ownerAddress) return true;
  const nullAddresses = [
    '0x0000000000000000000000000000000000000000',
    '0x000000000000000000000000000000000000dead',
    '0xdead000000000000000042069420694206942069',
  ];
  return nullAddresses.includes(ownerAddress.toLowerCase());
}

function formatBalance(balance: string, decimals?: number): string {
  try {
    const num = parseFloat(balance);
    if (isNaN(num)) return balance;
    
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    
    return num.toFixed(decimals || 2);
  } catch {
    return balance;
  }
}

function processHolder(holder: Holder) {
  return {
    address: holder.address,
    tag: holder.tag,
    isContract: booleanFromString(holder.is_contract),
    balance: formatBalance(holder.balance),
    rawBalance: holder.balance, // Keep raw balance for USD calculations
    percent: holder.percent,
    isLocked: booleanFromString(holder.is_locked),
  };
}

function processLPHolder(lpHolder: LPHolder) {
  // Detect locker service from tag
  let lockerService: string | undefined;
  if (lpHolder.tag) {
    const tag = lpHolder.tag.toLowerCase();
    // Map common locker services
    if (tag.includes('goplus')) lockerService = 'GoPlus SafeToken Locker';
    else if (tag.includes('pinklock')) lockerService = 'PinkLock';
    else if (tag.includes('uncx')) lockerService = 'UNCX';
    else if (tag.includes('mudra')) lockerService = 'Mudra';
    else if (tag.includes('deeplock')) lockerService = 'DeepLock';
    else if (tag.includes('dxlock')) lockerService = 'DxLock';
    else if (tag.includes('team')) lockerService = 'TeamFinace';
    else if (tag.includes('floki')) lockerService = 'Floki';
    else if (tag.includes('dao')) lockerService = 'DaoLock';
    else if (tag.includes('maple')) lockerService = 'MapleLocker';
    else if (tag.includes('onlymoons')) lockerService = 'OnlyMoons';
    else if (tag.includes('tokentool')) lockerService = 'TokenToolLock';
    else if (tag.includes('gempad')) lockerService = 'gempad';
    else if (tag.includes('party')) lockerService = 'partyDao';
    else if (tag.includes('mofo')) lockerService = 'MOFO';
    // If no specific match, use the tag as is
    else lockerService = lpHolder.tag;
  }
  
  return {
    address: lpHolder.address,
    tag: lpHolder.tag,
    isContract: booleanFromString(lpHolder.is_contract),
    balance: formatBalance(lpHolder.balance || '0'),
    percent: lpHolder.percent,
    isLocked: booleanFromString(lpHolder.is_locked),
    lockerService,
  };
}

function processEVMSecurityData(evmData: GoPlusTokenSecurity): ProcessedSecurityData {
  // Process security metrics
  const securityMetrics = Object.entries(SECURITY_METRICS_CONFIG).map(([key, config]) => {
    const value = evmData[key as keyof GoPlusTokenSecurity] as '0' | '1' | undefined;
    let boolValue = booleanFromString(value);
    
    // Invert logic for metrics where "1" means bad (like honeypot, blacklist, etc.)
    if (config.invert) {
      boolValue = !boolValue;
    }
    
    return {
      key,
      label: config.label,
      value: boolValue,
      critical: config.critical,
    };
  });

  // Process holder metrics
  const holders = (evmData.holders || []).map(processHolder);
  const holderMetrics = {
    holderCount: parseInt(evmData.holder_count || '0'),
    totalSupply: formatBalance(evmData.total_supply || '0'),
    topHolders: holders.slice(0, 10), // Ensure we show all available holders up to 10
  };

  // Process liquidity metrics
  const liquidityMetrics = {
    lpHolderCount: evmData.lp_holder_count ? parseInt(evmData.lp_holder_count) : undefined,
    lpTotalSupply: evmData.lp_total_supply ? formatBalance(evmData.lp_total_supply) : undefined,
    dexes: (evmData.dex || []).map(dex => ({
      name: dex.name,
      liquidity: formatBalance(dex.liquidity || '0'),
      pair: dex.pair,
      liquidityType: dex.liquidity_type,
    })),
    lpHolders: (evmData.lp_holders || []).map(processLPHolder),
  };

  // Process owner metrics
  const ownerMetrics = {
    ownerAddress: evmData.owner_address,
    isRenounced: isRenounced(evmData.owner_address),
    ownerBalance: evmData.owner_balance ? formatBalance(evmData.owner_balance) : undefined,
    ownerPercent: evmData.owner_percent,
    ownerChangeBalance: booleanFromString(evmData.owner_change_balance),
  };

  // Process token metrics
  const tokenMetrics = {
    totalSupply: formatBalance(evmData.total_supply || '0'),
    buyTax: evmData.buy_tax ? parseFloat(evmData.buy_tax) : undefined,
    sellTax: evmData.sell_tax ? parseFloat(evmData.sell_tax) : undefined,
    transferTax: evmData.transfer_tax ? parseFloat(evmData.transfer_tax) : undefined,
    tokenName: evmData.token_name,
    tokenSymbol: evmData.token_symbol,
  };

  return {
    securityMetrics,
    holderMetrics,
    liquidityMetrics,
    ownerMetrics,
    tokenMetrics,
    securityFlags: {
      isAirdropScam: evmData.is_airdrop_scam && booleanFromString(evmData.is_airdrop_scam),
      trustList: evmData.trust_list && booleanFromString(evmData.trust_list),
      fakeToken: evmData.fake_token && booleanFromString(evmData.fake_token.value),
      inCEX: evmData.is_in_cex && booleanFromString(evmData.is_in_cex.listed),
      launchpadToken: evmData.launchpad_token && booleanFromString(evmData.launchpad_token.is_launchpad_token),
      gasAbuse: evmData.gas_abuse && booleanFromString(evmData.gas_abuse),
    },
  };
}

function processSolanaSecurityData(solanaData: SolanaTokenSecurity): ProcessedSecurityData {
  // Process security metrics - adapt for Solana-specific fields
  const securityMetrics = [
    {
      key: 'mintable',
      label: 'Mintable',
      value: solanaData.mintable?.status !== '1', // Inverted: status "0" means not mintable (good)
      critical: false
    },
    {
      key: 'non_transferable',
      label: 'Transferable',
      value: solanaData.non_transferable !== '1', // Inverted: "0" means transferable (good)
      critical: true
    },
    {
      key: 'freezable',
      label: 'Freezable',
      value: solanaData.freezable?.status !== '1', // Inverted: status "0" means not freezable (good)
      critical: true
    },
    {
      key: 'closable',
      label: 'Closable',
      value: solanaData.closable?.status !== '1', // Inverted: status "0" means not closable (good)
      critical: true
    },
    {
      key: 'transfer_fee_upgradable',
      label: 'Transfer Fee Upgradable',
      value: solanaData.transfer_fee_upgradable?.status !== '1', // Inverted: status "0" means not upgradable (good)
      critical: false
    },
    {
      key: 'transfer_hook_upgradable',
      label: 'Transfer Hook Upgradable', 
      value: solanaData.transfer_hook_upgradable?.status !== '1', // Inverted: status "0" means not upgradable (good)
      critical: false
    },
    {
      key: 'metadata_mutable',
      label: 'Metadata Mutable',
      value: solanaData.metadata_mutable?.status !== '1', // Inverted: status "0" means not mutable (good)
      critical: false
    },
    {
      key: 'balance_mutable_authority',
      label: 'Balance Mutable Authority',
      value: solanaData.balance_mutable_authority?.status !== '1', // Inverted: status "0" means no authority (good)
      critical: true
    },
    {
      key: 'default_account_state_upgradable',
      label: 'Default Account State Upgradable',
      value: solanaData.default_account_state_upgradable?.status !== '1', // Inverted: status "0" means not upgradable (good)
      critical: false
    },
    {
      key: 'trusted_token',
      label: 'Trusted Token',
      value: solanaData.trusted_token === 1, // Direct: 1 means trusted (good)
      critical: false
    }
  ];

  // Process creators/owners
  const creators = solanaData.creators || [];
  const primaryCreator = creators[0];
  const ownerMetrics = {
    ownerAddress: primaryCreator?.address || '',
    isRenounced: !primaryCreator?.address,
    ownerBalance: '', // Not available in Solana data
    ownerPercent: '', // Not available in Solana data
  };

  // Process token metrics
  const tokenMetrics = {
    totalSupply: formatBalance(solanaData.total_supply || '0'),
    buyTax: solanaData.transfer_fee?.buy_fee_bps ? (parseFloat(solanaData.transfer_fee.buy_fee_bps) / 100) : undefined,
    sellTax: solanaData.transfer_fee?.sell_fee_bps ? (parseFloat(solanaData.transfer_fee.sell_fee_bps) / 100) : undefined,
    transferTax: solanaData.transfer_fee?.transfer_fee_bps ? (parseFloat(solanaData.transfer_fee.transfer_fee_bps) / 100) : undefined,
  };

  // Process holders
  const holders = (solanaData.holders || []).map(holder => ({
    address: holder.account,
    tag: holder.tag || '',
    isContract: false, // Not available in Solana data
    balance: formatBalance(holder.balance),
    rawBalance: holder.balance, // Keep raw balance for USD calculations
    percent: holder.percent, // Use as-is from API
    isLocked: booleanFromString(holder.is_locked),
  }));

  // Process LP holders
  const lpHolders = (solanaData.lp_holders || []).map(lpHolder => {
    // Detect locker service from tag
    let lockerService: string | undefined;
    if (lpHolder.tag) {
      const tag = lpHolder.tag.toLowerCase();
      if (tag.includes('raydium')) lockerService = 'raydium_lock';
      else if (tag.includes('orca')) lockerService = 'orca_lock';
      else if (tag.includes('meteora')) lockerService = 'meteora_lock';
      else lockerService = lpHolder.tag;
    }
    
    return {
      address: lpHolder.account,
      tag: lpHolder.tag || '',
      isContract: false, // Not available in Solana data
      balance: formatBalance(lpHolder.balance || '0'),
      percent: lpHolder.percent, // Use as-is from API
      isLocked: booleanFromString(lpHolder.is_locked),
      lockerService,
    };
  });

  // Process holder metrics
  const holderMetrics = {
    holderCount: parseInt(solanaData.holder_count || '0'),
    totalSupply: formatBalance(solanaData.total_supply || '0'),
    topHolders: holders,
  };

  // Process liquidity metrics
  const dexes = (solanaData.dex || []).map(dex => ({
    name: dex.dex_name || 'Unknown',
    liquidity: formatBalance(dex.tvl || '0'),
    pair: dex.id || '',
    liquidityType: dex.type,
  }));

  const liquidityMetrics = {
    dexes,
    lpHolders,
    lpHolderCount: lpHolders.length,
    lpTotalSupply: formatBalance(solanaData.total_supply || '0'),
  };

  return {
    securityMetrics,
    ownerMetrics,
    tokenMetrics,
    holderMetrics,
    liquidityMetrics,
    securityFlags: {
      isAirdropScam: false,
      trustList: solanaData.trusted_token === 1,
      fakeToken: false,
      inCEX: false,
      launchpadToken: false,
      gasAbuse: false,
    },
  };
}

function processSuiSecurityData(suiData: SuiTokenSecurity): ProcessedSecurityData {
  // Process Sui-specific security metrics
  const securityMetrics = [
    {
      key: 'is_open_source',
      label: 'Open Source',
      value: booleanFromString(suiData.is_open_source),
      critical: false,
    },
    {
      key: 'is_honeypot',
      label: 'Honeypot Check',
      value: !booleanFromString(suiData.is_honeypot), // Invert because honeypot is bad
      critical: true,
    },
  ];

  // Process holder metrics (limited in Sui)
  const holderMetrics = {
    holderCount: parseInt(String(suiData.holder_count || '0')),
    totalSupply: formatBalance(suiData.total_supply || '0'),
    topHolders: [], // Not available in current Sui API
  };

  // Limited liquidity metrics for Sui
  const liquidityMetrics = {
    dexes: [],
    lpHolders: [],
  };

  // Process creator/authority as owner metrics
  const ownerMetrics = {
    ownerAddress: suiData.creator_address,
    isRenounced: !suiData.creator_address,
    ownerBalance: undefined,
    ownerPercent: undefined,
  };

  // Process token metrics
  const tokenMetrics = {
    totalSupply: formatBalance(suiData.total_supply || '0'),
    buyTax: undefined, // Not applicable to Sui
    sellTax: undefined,
    transferTax: undefined,
  };

  return {
    securityMetrics,
    holderMetrics,
    liquidityMetrics,
    ownerMetrics,
    tokenMetrics,
    securityFlags: {
      isAirdropScam: false, // Not available in Sui API
      trustList: false, // Not available in Sui API
      fakeToken: false, // Not available in Sui API
      inCEX: false, // Not available in Sui API
      launchpadToken: false, // Not available in Sui API
      gasAbuse: false, // Not available in Sui API
    },
  };
}
