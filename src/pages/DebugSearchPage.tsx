/**
 * Minimal debug page for testing search in Telegram
 */

import { useState } from 'react';
import { apiManager } from '../lib/client-api';

export default function DebugSearchPage() {
  const [query, setQuery] = useState('USDC');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Debug] ${message}`);
  };

  const testSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLogs([]);

    try {
      addLog('Starting search test...');

      // Test authentication first
      addLog('Checking authentication...');
      const isAuth = apiManager.isAuthenticated();
      addLog(`Already authenticated: ${isAuth}`);

      if (!isAuth) {
        addLog('Attempting authentication...');
        const authSuccess = await apiManager.authenticate();
        addLog(`Authentication result: ${authSuccess}`);
        
        if (!authSuccess) {
          throw new Error('Authentication failed');
        }
      }

      // Test search
      addLog(`Searching for: "${query}"`);
      const searchResult = await apiManager.search(query);
      addLog(`Search completed successfully`);
      addLog(`Result: ${searchResult?.pairs?.length || 0} pairs found`);

      setResult(searchResult);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Error: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '14px',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      <h2>🔍 Search Debug</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search query"
          style={{
            width: '200px',
            padding: '8px',
            marginRight: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <button
          onClick={testSearch}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Search'}
        </button>
      </div>

      {logs.length > 0 && (
        <div style={{ 
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <h4>Debug Logs:</h4>
          {logs.map((log, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
              {log}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{
          padding: '10px',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Success!</strong> Found {result.pairs?.length || 0} pairs
          {result.pairs?.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>First result:</strong><br/>
              {result.pairs[0].baseToken?.symbol}/{result.pairs[0].quoteToken?.symbol} on {result.pairs[0].chainId}<br/>
              Price: ${result.pairs[0].priceUsd || 'N/A'}
            </div>
          )}
        </div>
      )}

      <div style={{ 
        fontSize: '12px',
        color: '#666',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <strong>Environment Info:</strong><br/>
        User Agent: {navigator.userAgent.substring(0, 50)}...<br/>
        Has Telegram: {typeof (window as any).Telegram !== 'undefined' ? 'Yes' : 'No'}<br/>
        Allow Non-Telegram: {import.meta.env.VITE_ALLOW_NON_TELEGRAM || 'false'}
      </div>
    </div>
  );
}
