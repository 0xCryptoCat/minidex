/**
 * Test page for debugging the new client-side API architecture
 * Access this at /test-api to verify JWT authentication and direct API calls work
 */

import { useState, useEffect } from 'react';
import { apiManager } from '../lib/client-api';

export default function TestAPIPage() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'failed'>('checking');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = apiManager.isAuthenticated();
      if (!isAuth) {
        const authSuccess = await apiManager.authenticate();
        setAuthStatus(authSuccess ? 'authenticated' : 'failed');
      } else {
        setAuthStatus('authenticated');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthStatus('failed');
    }
  };

  const runTests = async () => {
    if (authStatus !== 'authenticated') {
      alert('Please authenticate first');
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    const results: any[] = [];

    // Test 1: Search API
    try {
      console.log('Testing search API...');
      const searchResult = await apiManager.search('USDC');
      results.push({
        test: 'Search API',
        status: 'success',
        data: searchResult,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      results.push({
        test: 'Search API',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }

    // Test 2: Security API (GoPlus)
    try {
      console.log('Testing security API...');
      const securityResult = await apiManager.getSecurity(
        '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        'ethereum'
      );
      results.push({
        test: 'Security API',
        status: 'success',
        data: securityResult,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      results.push({
        test: 'Security API',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }

    // Test 3: OHLC API (if we can get a pair ID)
    if (results[0]?.status === 'success' && results[0]?.data?.pairs?.[0]) {
      try {
        console.log('Testing OHLC API...');
        const pair = results[0].data.pairs[0];
        const ohlcResult = await apiManager.getOHLC({
          pairId: pair.pairId || pair.id,
          chain: 'ethereum',
          tf: '1h',
        });
        results.push({
          test: 'OHLC API',
          status: 'success',
          data: ohlcResult,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        results.push({
          test: 'OHLC API',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  return (
    <div style={{ 
      padding: '20px',
      fontFamily: 'monospace',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <h1>🧪 Client-Side API Test Page</h1>
      
      <div style={{ 
        padding: '16px',
        marginBottom: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
      }}>
        <h2>Authentication Status</h2>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '12px',
        }}>
          <span>Status:</span>
          <span style={{ 
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: authStatus === 'authenticated' ? '#d4edda' : 
                           authStatus === 'failed' ? '#f8d7da' : '#fff3cd',
            color: authStatus === 'authenticated' ? '#155724' : 
                   authStatus === 'failed' ? '#721c24' : '#856404',
          }}>
            {authStatus}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={checkAuth}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry Authentication
          </button>
          
          <button 
            onClick={runTests}
            disabled={authStatus !== 'authenticated' || isRunning}
            style={{
              padding: '8px 16px',
              backgroundColor: authStatus === 'authenticated' && !isRunning ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: authStatus === 'authenticated' && !isRunning ? 'pointer' : 'not-allowed',
            }}
          >
            {isRunning ? 'Running Tests...' : 'Run API Tests'}
          </button>
        </div>
      </div>

      {testResults.length > 0 && (
        <div style={{ 
          padding: '16px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
        }}>
          <h2>Test Results</h2>
          {testResults.map((result, index) => (
            <div 
              key={index}
              style={{ 
                marginBottom: '16px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h3 style={{ margin: 0 }}>{result.test}</h3>
                <span style={{ 
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: result.status === 'success' ? '#d4edda' : '#f8d7da',
                  color: result.status === 'success' ? '#155724' : '#721c24',
                }}>
                  {result.status}
                </span>
                <small style={{ color: '#666' }}>{result.timestamp}</small>
              </div>
              
              {result.error && (
                <div style={{ 
                  padding: '8px',
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  borderRadius: '4px',
                  marginBottom: '8px',
                }}>
                  Error: {result.error}
                </div>
              )}
              
              {result.data && (
                <details>
                  <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                    View Response Data
                  </summary>
                  <pre style={{ 
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '12px',
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        marginTop: '40px',
        padding: '16px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
      }}>
        <h2>📋 Test Instructions</h2>
        <ol>
          <li><strong>Authentication:</strong> The app will try to authenticate using Telegram WebApp data</li>
          <li><strong>JWT Token:</strong> A JWT token is obtained from <code>/auth-token</code> endpoint</li>
          <li><strong>Validation:</strong> Each API call is validated server-side via <code>/validate-request</code></li>
          <li><strong>Direct Calls:</strong> After validation, the browser makes direct calls to external APIs</li>
        </ol>
        
        <h3>🔧 Expected Behavior</h3>
        <ul>
          <li>✅ Authentication should succeed if in Telegram WebApp context</li>
          <li>✅ Search should return token data from DexScreener/GeckoTerminal</li>
          <li>✅ Security should return token safety data from GoPlus</li>
          <li>✅ OHLC should return price chart data from GeckoTerminal</li>
        </ul>
        
        <h3>🐛 Troubleshooting</h3>
        <ul>
          <li>If auth fails, check if running in Telegram WebApp</li>
          <li>If API calls fail, check browser network tab for CORS errors</li>
          <li>If validation fails, check JWT token and server-side logs</li>
        </ul>
      </div>
    </div>
  );
}
