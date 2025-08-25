// Simple test script to call trades API with fixtures
const url = 'http://localhost:8888/.netlify/functions/trades?pairId=test&chain=ethereum&poolAddress=0x1234567890123456789012345678901234567890&limit=10';

console.log('Testing trades API with fixtures...');
console.log('URL:', url);

fetch(url)
  .then(res => {
    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    return res.json();
  })
  .then(data => {
    console.log('Response:', JSON.stringify(data, null, 2));
    if (data.trades) {
      console.log('Trade volumes:', data.trades.map(t => ({ volumeUSD: t.volumeUSD, price: t.price, amountBase: t.amountBase })));
    }
  })
  .catch(err => {
    console.error('Error:', err);
  });
