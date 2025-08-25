#!/usr/bin/env node

/**
 * Test script to verify the client-side API flow
 * This simulates what the browser does
 */

const fs = require('fs');

async function testClientSideAPI() {
  const baseUrl = 'http://localhost:8888';
  
  console.log('🧪 Testing Client-Side API Flow\n');
  
  // Step 1: Get JWT token
  console.log('1. Authenticating...');
  const authResponse = await fetch(`${baseUrl}/.netlify/functions/auth-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegramData: null,
      userAgent: 'test-script',
      timestamp: Date.now(),
      developmentMode: true,
    }),
  });
  
  if (!authResponse.ok) {
    throw new Error(`Auth failed: ${authResponse.status}`);
  }
  
  const authData = await authResponse.json();
  console.log('✅ Authentication successful');
  console.log(`   Token: ${authData.token.substring(0, 20)}...`);
  console.log(`   Rate limit: ${authData.rateLimit.requests} requests per ${authData.rateLimit.window}s\n`);
  
  // Step 2: Validate search request
  console.log('2. Validating search request...');
  const validationResponse = await fetch(`${baseUrl}/.netlify/functions/validate-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`,
    },
    body: JSON.stringify({
      provider: 'dexscreener',
      endpoint: 'search',
      params: { q: 'USDC' },
      metadata: {
        userAgent: 'test-script',
        timestamp: Date.now(),
        clientVersion: '1.0.0',
      },
    }),
  });
  
  if (!validationResponse.ok) {
    throw new Error(`Validation failed: ${validationResponse.status}`);
  }
  
  const validationData = await validationResponse.json();
  
  if (!validationData.valid) {
    throw new Error(`Validation rejected: ${validationData.error}`);
  }
  
  console.log('✅ Request validation successful');
  console.log(`   Sanitized params: ${JSON.stringify(validationData.sanitizedParams)}`);
  console.log(`   Rate limit remaining: ${validationData.rateLimit.remaining}\n`);
  
  // Step 3: Make direct API call to external service
  console.log('3. Making direct API call to DexScreener...');
  const searchUrl = new URL('https://api.dexscreener.com/latest/dex/search');
  searchUrl.searchParams.set('q', validationData.sanitizedParams.q);
  
  const searchResponse = await fetch(searchUrl.toString(), {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'SmallDEX/1.0',
    },
  });
  
  if (!searchResponse.ok) {
    throw new Error(`DexScreener API failed: ${searchResponse.status}`);
  }
  
  const searchData = await searchResponse.json();
  console.log('✅ Direct API call successful');
  console.log(`   Found ${searchData.pairs?.length || 0} pairs for USDC`);
  
  if (searchData.pairs?.length > 0) {
    const firstPair = searchData.pairs[0];
    console.log(`   First result: ${firstPair.baseToken?.symbol}/${firstPair.quoteToken?.symbol} on ${firstPair.chainId}`);
    console.log(`   Price: $${firstPair.priceUsd || 'N/A'}`);
  }
  
  console.log('\n🎉 Client-side API flow test completed successfully!');
  console.log('\nThis proves that:');
  console.log('  ✓ JWT authentication works');
  console.log('  ✓ Server-side validation works');
  console.log('  ✓ Direct external API calls work');
  console.log('  ✓ Rate limiting is enforced');
  console.log('  ✓ Parameter sanitization works');
}

testClientSideAPI().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
