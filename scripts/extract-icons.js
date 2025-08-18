#!/usr/bin/env node

const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

function extractChainIcons(htmlContent) {
  const icons = [];
  
  // Regex to match chain entries with href and img src
  const chainRegex = /href="\/en\/chains\/([^"]+)"[^>]*>[\s\S]*?<img[^>]+alt="([^"]+)"[^>]+src="([^"?]+)/g;
  
  let match;
  while ((match = chainRegex.exec(htmlContent)) !== null) {
    const [, id, name, url] = match;
    
    // Skip if this looks like a coin/token (contains "top gainers" context)
    const contextBefore = htmlContent.substring(Math.max(0, match.index - 200), match.index);
    if (contextBefore.includes('Top Gainers') || contextBefore.includes('top gainers')) {
      continue;
    }
    
    // Clean up the URL and name
    const cleanUrl = url.trim();
    const cleanName = name.trim();
    const cleanId = id.trim();
    
    // Only add if this looks like a chain icon URL
    if (cleanUrl.includes('asset_platforms') || cleanUrl.includes('chains')) {
      icons.push({
        name: cleanName,
        id: cleanId,
        url: cleanUrl
      });
    }
  }
  
  // Remove duplicates based on ID
  const uniqueIcons = icons.reduce((acc, current) => {
    const existing = acc.find(icon => icon.id === current.id);
    if (!existing) {
      acc.push(current);
    }
    return acc;
  }, []);
  
  return uniqueIcons.sort((a, b) => a.name.localeCompare(b.name));
}

function extractDexIcons(htmlContent) {
  const icons = [];
  
  // Regex to match DEX entries with alt and img src
  const dexRegex = /<img[^>]+alt="([^"]+)"[^>]+src="([^"?]+)[^>]*>/g;
  
  let match;
  while ((match = dexRegex.exec(htmlContent)) !== null) {
    const [, name, url] = match;
    
    // Clean up the URL and name
    const cleanUrl = url.trim();
    const cleanName = name.trim();
    
    // Only add if this looks like a DEX icon URL (should be in markets/images)
    if (cleanUrl.includes('markets/images') && cleanUrl.includes('coingecko.com')) {
      // Extract ID from the URL path
      const urlMatch = cleanUrl.match(/markets\/images\/(\d+)\//);
      const id = urlMatch ? urlMatch[1] : cleanName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      icons.push({
        name: cleanName,
        id,
        url: cleanUrl
      });
    }
  }
  
  // Remove duplicates based on name
  const uniqueIcons = icons.reduce((acc, current) => {
    const existing = acc.find(icon => icon.name === current.name);
    if (!existing) {
      acc.push(current);
    }
    return acc;
  }, []);
  
  return uniqueIcons.sort((a, b) => a.name.localeCompare(b.name));
}

function generateIconsMapping(chains, dexes) {
  const chainMapping = {};
  const dexMapping = {};
  
  // Create chain mapping
  for (const chain of chains) {
    chainMapping[chain.id] = chain.url;
    // Also add common variations
    const variations = [
      chain.name.toLowerCase(),
      chain.name.toLowerCase().replace(/\s+/g, '-'),
      chain.name.toLowerCase().replace(/\s+/g, '_'),
      chain.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    ];
    for (const variation of variations) {
      if (!chainMapping[variation]) {
        chainMapping[variation] = chain.url;
      }
    }
  }
  
  // Create DEX mapping
  for (const dex of dexes) {
    const dexKey = dex.name.toLowerCase()
      .replace(/\s*\([^)]*\)/g, '') // Remove parentheses content like (BSC)
      .replace(/\s+v\d+/i, '') // Remove version numbers like V3
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    dexMapping[dexKey] = dex.url;
    dexMapping[dex.id] = dex.url;
    
    // Also add the full name as key
    const fullKey = dex.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    dexMapping[fullKey] = dex.url;
  }
  
  return { chainMapping, dexMapping };
}

async function main() {
  const docsDir = join(process.cwd(), 'docs');
  const srcDir = join(process.cwd(), 'src');
  
  try {
    console.log('📖 Reading coingecko data files...');
    
    // Read the markdown files
    const chainsContent = readFileSync(join(docsDir, 'coingecko_chains.md'), 'utf-8');
    const dexesContent = readFileSync(join(docsDir, 'coingecko_dexes.md'), 'utf-8');
    
    console.log('🔍 Extracting chain icons...');
    const chains = extractChainIcons(chainsContent);
    console.log(`   Found ${chains.length} chain icons`);
    
    console.log('🔍 Extracting DEX icons...');
    const dexes = extractDexIcons(dexesContent);
    console.log(`   Found ${dexes.length} DEX icons`);
    
    console.log('🔧 Generating icon mappings...');
    const { chainMapping, dexMapping } = generateIconsMapping(chains, dexes);
    
    // Generate the icons data
    const iconsData = {
      chains: chainMapping,
      dexes: dexMapping,
      metadata: {
        generated: new Date().toISOString(),
        chainCount: chains.length,
        dexCount: dexes.length
      }
    };
    
    // Save the icons data as JSON
    const iconsJsonPath = join(srcDir, 'lib', 'icons-data.json');
    writeFileSync(iconsJsonPath, JSON.stringify(iconsData, null, 2));
    console.log(`✅ Icons data saved to ${iconsJsonPath}`);
    
    // Generate debug output
    const debugPath = join(process.cwd(), 'extracted-icons-debug.json');
    writeFileSync(debugPath, JSON.stringify({
      chains: chains.map(c => ({ ...c, variations: [c.id, c.name.toLowerCase(), c.name.toLowerCase().replace(/\s+/g, '-')] })),
      dexes: dexes.map(d => ({ ...d, key: d.name.toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/\s+v\d+/i, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))
    }, null, 2));
    console.log(`🐛 Debug data saved to ${debugPath}`);
    
    console.log('\n📊 Summary:');
    console.log(`   Chain icons: ${chains.length}`);
    console.log(`   DEX icons: ${dexes.length}`);
    console.log(`   Chain mappings: ${Object.keys(chainMapping).length}`);
    console.log(`   DEX mappings: ${Object.keys(dexMapping).length}`);
    
    // Show some examples
    console.log('\n🔍 Sample chain mappings:');
    Object.entries(chainMapping).slice(0, 5).forEach(([key, url]) => {
      console.log(`   ${key} -> ${url}`);
    });
    
    console.log('\n🔍 Sample DEX mappings:');
    Object.entries(dexMapping).slice(0, 5).forEach(([key, url]) => {
      console.log(`   ${key} -> ${url}`);
    });
    
  } catch (error) {
    console.error('❌ Error extracting icons:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
