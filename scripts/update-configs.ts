#!/usr/bin/env tsx

/**
 * Script to process GT networks/dexes data and update SmallDEX configurations
 * Expands support for all GT networks and DEXes
 */

import fs from 'fs/promises';
import path from 'path';

interface GTNetwork {
  id: string;
  name: string;
  coingecko_asset_platform_id: string | null;
  dexes: Array<{
    id: string;
    name: string;
  }>;
}

interface GTData {
  generated_at: string;
  source: string;
  total_networks: number;
  total_dexes: number;
  networks: GTNetwork[];
}

// Manual mapping for GT network ID to common chain names used in SmallDEX
const GT_TO_CHAIN_MAPPING: Record<string, string> = {
  'eth': 'ethereum',
  'bsc': 'bsc',
  'polygon_pos': 'polygon',
  'avax': 'avalanche', 
  'arbitrum': 'arbitrum',
  'optimism': 'optimism',
  'ftm': 'fantom',
  'base': 'base',
  'linea': 'linea',
  'scroll': 'scroll',
  'zksync': 'zksync',
  'polygon-zkevm': 'polygonzkevm',
  'mantle': 'mantle',
  'arbitrum_nova': 'arbitrumnova',
  'xdai': 'gnosis',
  'glmr': 'moonbeam',
  'movr': 'moonriver',
  'cro': 'cronos',
  'one': 'harmony',
  'celo': 'celo',
  'aurora': 'aurora',
  'metis': 'metis',
  'boba': 'boba',
  'kava': 'kava',
  'solana': 'solana',
  'aptos': 'aptos',
  'sui-network': 'sui',
  'sei-network': 'sei',
  'manta-pacific': 'manta',
  'lightlink-phoenix': 'lightlink',
  'step-network': 'stepnetwork',
  'starknet-alpha': 'starknet',
  'neon-evm': 'neonevm',
  'eos-evm': 'eosevm',
  'hedera-hashgraph': 'hedera',
  'mxc-zkevm': 'mxczkevm',
  'bitkub_chain': 'bitkub',
  'platon_network': 'platon',
  'ethereum_classic': 'etc',
  'sepolia-testnet': 'sepolia',
  // Add more safe mappings as needed
};

// Networks that should be prioritized (top tier by volume/usage)
const PRIORITY_NETWORKS = new Set([
  'eth', 'solana', 'bsc', 'polygon_pos', 'avax', 'arbitrum', 'optimism', 
  'base', 'ftm', 'linea', 'scroll', 'zksync'
]);

/**
 * Load the fetched GT data
 */
async function loadGTData(): Promise<GTData> {
  const dataPath = path.join(process.cwd(), 'data', 'gt-networks-dexes.json');
  const content = await fs.readFile(dataPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Generate updated chains.ts file
 */
async function updateChainsConfig(data: GTData): Promise<void> {
  console.log('🔗 Updating chains configuration...');
  
  const chainMappings: Record<string, string> = {};
  const priorityNetworks: string[] = [];
  const allNetworks: string[] = [];
  
  // Process networks and create mappings
  for (const network of data.networks) {
    // Convert GT network ID to valid JS property name
    const chainName = GT_TO_CHAIN_MAPPING[network.id] || 
      network.id.replace(/[_-]/g, '').replace(/[^a-zA-Z0-9]/g, '');
    chainMappings[chainName] = network.id;
    allNetworks.push(chainName);
    
    if (PRIORITY_NETWORKS.has(network.id)) {
      priorityNetworks.push(chainName);
    }
  }
  
  // Generate the new chains.ts content
  const chainsContent = `/**
 * Chain to GeckoTerminal network mapping
 * Auto-generated from GT API data on ${new Date().toISOString()}
 * 
 * Total networks: ${data.total_networks}
 * Total DEXes: ${data.total_dexes}
 */

// Priority networks (high volume/usage)
export const PRIORITY_CHAINS = [
${priorityNetworks.map(chain => `  '${chain}',`).join('\n')}
] as const;

// Complete chain to GT network mapping
export const CHAIN_TO_GT_NETWORK: Record<string, string> = {
${Object.entries(chainMappings)
  .sort(([a], [b]) => {
    // Sort priority chains first, then alphabetically
    const aPriority = priorityNetworks.includes(a);
    const bPriority = priorityNetworks.includes(b);
    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;
    return a.localeCompare(b);
  })
  .map(([chain, gtNetwork]) => `  ${chain}: '${gtNetwork}',${priorityNetworks.includes(chain) ? ' // Priority' : ''}`)
  .join('\n')}
};

export const SUPPORTED_GT_NETWORKS = new Set(Object.values(CHAIN_TO_GT_NETWORK));

export type GTNetwork = (typeof CHAIN_TO_GT_NETWORK)[keyof typeof CHAIN_TO_GT_NETWORK];

export function toGTNetwork(chain: string): GTNetwork | null {
  return (CHAIN_TO_GT_NETWORK as Record<string, GTNetwork>)[chain] ?? null;
}

export function isPriorityChain(chain: string): boolean {
  return PRIORITY_CHAINS.includes(chain as any);
}

// Network metadata for display purposes
export const NETWORK_INFO: Record<string, { name: string; platformId?: string }> = {
${data.networks
  .map(network => {
    const chainName = GT_TO_CHAIN_MAPPING[network.id] || 
      network.id.replace(/[_-]/g, '').replace(/[^a-zA-Z0-9]/g, '');
    return `  ${chainName}: { name: '${network.name}', platformId: ${network.coingecko_asset_platform_id ? `'${network.coingecko_asset_platform_id}'` : 'undefined'} },`;
  })
  .sort()
  .join('\n')}
};
`;

  // Write the updated chains.ts file
  const chainsPath = path.join(process.cwd(), 'netlify', 'shared', 'chains.ts');
  await fs.writeFile(chainsPath, chainsContent);
  
  console.log(`✅ Updated chains.ts with ${Object.keys(chainMappings).length} networks`);
}

/**
 * Generate updated dex-allow.ts file
 */
async function updateDexAllowConfig(data: GTData): Promise<void> {
  console.log('🏪 Updating DEX allowlist configuration...');
  
  const allDexes = new Set<string>();
  const dexesByNetwork: Record<string, string[]> = {};
  
  // Collect all DEXes and organize by network
  for (const network of data.networks) {
    dexesByNetwork[network.id] = [];
    for (const dex of network.dexes) {
      allDexes.add(dex.id);
      dexesByNetwork[network.id].push(dex.id);
    }
  }
  
  // Generate the new dex-allow.ts content
  const dexAllowContent = `/**
 * DEX allowlist for GeckoTerminal API support
 * Auto-generated from GT API data on ${new Date().toISOString()}
 * 
 * Total networks: ${data.total_networks}
 * Total unique DEXes: ${allDexes.size}
 */

// All supported DEXes across all networks
export const ALLOW = new Set([
${Array.from(allDexes)
  .sort()
  .map(dex => `  '${dex}',`)
  .join('\n')}
]);

// Priority DEXes (commonly used across multiple networks)
export const PRIORITY_DEXES = new Set([
  'uniswap_v2',
  'uniswap_v3', 
  'sushiswap',
  'pancakeswap_v2',
  'pancakeswap_v3',
  'quickswap',
  'trader_joe_v2',
  'spookyswap',
  'spiritswap',
  'curve',
  'balancer_v2',
  'orca',
  'raydium',
]);

// DEXes by network for filtering/display
export const DEXES_BY_NETWORK: Record<string, string[]> = {
${Object.entries(dexesByNetwork)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([network, dexes]) => {
    // Convert network ID to valid JS property name
    const safeName = network.replace(/[-]/g, '_');
    return `  "${safeName}": [${dexes.map(d => `'${d}'`).join(', ')}],`;
  })
  .join('\n')}
};

export function isGtSupported(dex?: string, version?: string): boolean {
  if (!dex) return false;
  const key = \`\${dex.toLowerCase()}\${version ? '_' + version.toLowerCase() : ''}\`;
  return ALLOW.has(key);
}

export function isPriorityDex(dex: string): boolean {
  return PRIORITY_DEXES.has(dex);
}

export function getDexesForNetwork(network: string): string[] {
  return DEXES_BY_NETWORK[network] || [];
}

export function getNetworksForDex(dexId: string): string[] {
  return Object.entries(DEXES_BY_NETWORK)
    .filter(([_, dexes]) => dexes.includes(dexId))
    .map(([network]) => network);
}
`;

  // Write the updated dex-allow.ts file
  const dexAllowPath = path.join(process.cwd(), 'netlify', 'shared', 'dex-allow.ts');
  await fs.writeFile(dexAllowPath, dexAllowContent);
  
  console.log(`✅ Updated dex-allow.ts with ${allDexes.size} DEXes across ${data.networks.length} networks`);
}

/**
 * Generate network statistics and summary
 */
async function generateNetworkSummary(data: GTData): Promise<void> {
  console.log('📊 Generating network summary...');
  
  const summaryPath = path.join(process.cwd(), 'data', 'network-summary.json');
  
  const summary = {
    generated_at: new Date().toISOString(),
    total_networks: data.total_networks,
    total_dexes: data.total_dexes,
    priority_networks: data.networks.filter(n => PRIORITY_NETWORKS.has(n.id)).length,
    top_networks_by_dexes: data.networks
      .sort((a, b) => b.dexes.length - a.dexes.length)
      .slice(0, 20)
      .map(n => ({
        id: n.id,
        name: n.name,
        dex_count: n.dexes.length,
        is_priority: PRIORITY_NETWORKS.has(n.id)
      })),
    dex_distribution: {
      networks_with_50_plus_dexes: data.networks.filter(n => n.dexes.length >= 50).length,
      networks_with_20_plus_dexes: data.networks.filter(n => n.dexes.length >= 20).length,
      networks_with_10_plus_dexes: data.networks.filter(n => n.dexes.length >= 10).length,
      networks_with_single_dex: data.networks.filter(n => n.dexes.length === 1).length,
    }
  };
  
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✅ Generated network summary at ${summaryPath}`);
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Processing GeckoTerminal data for SmallDEX integration...\n');
  
  try {
    // Load the fetched data
    const data = await loadGTData();
    console.log(`📈 Loaded data: ${data.total_networks} networks, ${data.total_dexes} DEXes\n`);
    
    // Update configurations
    await updateChainsConfig(data);
    await updateDexAllowConfig(data);
    await generateNetworkSummary(data);
    
    console.log('\n✅ SmallDEX GT integration complete!');
    console.log('📋 Summary:');
    console.log(`   • Supported networks: ${data.total_networks}`);
    console.log(`   • Supported DEXes: ${data.total_dexes}`);
    console.log(`   • Updated files:`);
    console.log(`     - netlify/shared/chains.ts`);
    console.log(`     - netlify/shared/dex-allow.ts`);
    console.log(`     - data/network-summary.json`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
