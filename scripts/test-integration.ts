#!/usr/bin/env tsx

/**
 * Test script to verify GT integration is working
 */

import { toGTNetwork, isPriorityChain, CHAIN_TO_GT_NETWORK, NETWORK_INFO } from '../netlify/shared/chains';
import { isGtSupported, isPriorityDex, getDexesForNetwork } from '../netlify/shared/dex-allow';

function runTests() {
  console.log('🧪 Testing SmallDEX GT Integration...\n');
  
  // Test 1: Chain mapping
  console.log('📋 Test 1: Chain Mapping');
  const testChains = ['ethereum', 'base', 'solana', 'mantle', 'scroll'];
  testChains.forEach(chain => {
    const gtNetwork = toGTNetwork(chain);
    const isPriority = isPriorityChain(chain);
    const info = NETWORK_INFO[chain];
    console.log(`  ${chain} -> ${gtNetwork} ${isPriority ? '(Priority)' : ''} - ${info?.name || 'Unknown'}`);
  });
  
  // Test 2: DEX support
  console.log('\n🏪 Test 2: DEX Support');
  const testDexes = ['uniswap_v3', 'pancakeswap_v2', 'aerodrome-base', 'spookyswap', 'orca'];
  testDexes.forEach(dex => {
    const supported = isGtSupported(dex);
    const isPriority = isPriorityDex(dex);
    console.log(`  ${dex}: ${supported ? '✅' : '❌'} ${isPriority ? '(Priority)' : ''}`);
  });
  
  // Test 3: Network DEX counts  
  console.log('\n📊 Test 3: Network DEX Counts');
  const testNetworks = ['eth', 'bsc', 'base', 'arbitrum', 'solana'];
  testNetworks.forEach(network => {
    const dexes = getDexesForNetwork(network);
    console.log(`  ${network}: ${dexes.length} DEXes`);
  });
  
  // Test 4: Summary stats
  console.log('\n📈 Test 4: Summary Statistics');
  const totalNetworks = Object.keys(CHAIN_TO_GT_NETWORK).length;
  const totalDexes = getDexesForNetwork('eth').length + getDexesForNetwork('bsc').length; // Sample
  console.log(`  Total Networks: ${totalNetworks}`);
  console.log(`  Sample DEX coverage: ${totalDexes}+ DEXes`);
  
  console.log('\n✅ All tests completed!');
}

if (require.main === module) {
  runTests();
}
