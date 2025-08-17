#!/usr/bin/env tsx

/**
 * Script to fetch GeckoTerminal networks and their DEXes
 * Generates comprehensive JSON for expanding SmallDEX support
 */

import fs from 'fs/promises';
import path from 'path';

// Rate limiting to respect GT API limits (typically 30 requests/minute)
const RATE_LIMIT_MS = 2000; // 2 seconds per request

interface GTNetwork {
  id: string;
  name: string;
  coingecko_asset_platform_id: string | null;
}

interface GTDex {
  id: string;
  name: string;
}

interface NetworkWithDexes {
  id: string;
  name: string;
  coingecko_asset_platform_id: string | null;
  dexes: GTDex[];
}

// Helper to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract networks from gt_networks.md file
 */
async function extractNetworksFromDocs(): Promise<GTNetwork[]> {
  const docPath = path.join(process.cwd(), 'docs', 'gt_networks.md');
  const content = await fs.readFile(docPath, 'utf-8');
  
  const networks: GTNetwork[] = [];
  const networkRegex = /"id": "([^"]+)"[\s\S]*?"name": "([^"]+)"[\s\S]*?"coingecko_asset_platform_id": (?:"([^"]+)"|null)/g;
  
  let match;
  while ((match = networkRegex.exec(content)) !== null) {
    networks.push({
      id: match[1],
      name: match[2],
      coingecko_asset_platform_id: match[3] || null
    });
  }
  
  console.log(`📊 Extracted ${networks.length} networks from documentation`);
  return networks;
}

/**
 * Fetch DEXes for a specific network from GT API
 */
async function fetchDexesForNetwork(networkId: string): Promise<GTDex[]> {
  try {
    console.log(`🔍 Fetching DEXes for network: ${networkId}`);
    
    const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/${networkId}/dexes`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ⚠️  Network ${networkId} not found or has no DEXes`);
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const dexes: GTDex[] = data.data?.map((dex: any) => ({
      id: dex.id,
      name: dex.attributes.name
    })) || [];
    
    console.log(`  ✅ Found ${dexes.length} DEXes for ${networkId}`);
    return dexes;
    
  } catch (error) {
    console.error(`  ❌ Error fetching DEXes for ${networkId}:`, error);
    return [];
  }
}

/**
 * Main function to fetch all data
 */
async function main() {
  console.log('🚀 Starting GeckoTerminal data fetching...\n');
  
  try {
    // Step 1: Extract networks from documentation
    const networks = await extractNetworksFromDocs();
    
    // Step 2: Fetch DEXes for each network with rate limiting
    const networksWithDexes: NetworkWithDexes[] = [];
    
    for (let i = 0; i < networks.length; i++) {
      const network = networks[i];
      
      console.log(`\n📡 Processing ${i + 1}/${networks.length}: ${network.name} (${network.id})`);
      
      const dexes = await fetchDexesForNetwork(network.id);
      
      networksWithDexes.push({
        ...network,
        dexes
      });
      
      // Rate limiting - wait between requests
      if (i < networks.length - 1) {
        console.log(`  ⏳ Rate limiting... waiting ${RATE_LIMIT_MS}ms`);
        await delay(RATE_LIMIT_MS);
      }
    }
    
    // Step 3: Generate comprehensive JSON
    const outputData = {
      generated_at: new Date().toISOString(),
      source: 'GeckoTerminal API',
      total_networks: networksWithDexes.length,
      total_dexes: networksWithDexes.reduce((sum, n) => sum + n.dexes.length, 0),
      networks: networksWithDexes
    };
    
    // Step 4: Write to file
    const outputPath = path.join(process.cwd(), 'data', 'gt-networks-dexes.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2));
    
    console.log(`\n✅ Data fetching complete!`);
    console.log(`📊 Summary:`);
    console.log(`   • Total networks: ${outputData.total_networks}`);
    console.log(`   • Total DEXes: ${outputData.total_dexes}`);
    console.log(`   • Output file: ${outputPath}`);
    
    // Step 5: Generate summary statistics
    const networksByDexCount = networksWithDexes
      .sort((a, b) => b.dexes.length - a.dexes.length)
      .slice(0, 10);
    
    console.log(`\n🏆 Top 10 networks by DEX count:`);
    networksByDexCount.forEach((network, idx) => {
      console.log(`   ${idx + 1}. ${network.name}: ${network.dexes.length} DEXes`);
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
