/**
 * Example usage of the new client-side API with JWT authentication
 * Replace your existing API calls with this pattern
 */

import { useEffect, useState } from 'react';
import { apiManager } from '../lib/client-api';

interface SearchResult {
  address: string;
  symbol: string;
  name: string;
  price: number;
}

export function useSecureSearch(query: string, chain?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTokens = async () => {
      setLoading(true);
      setError(null);

      try {
        // The API manager handles JWT auth, validation, rate limiting, and sanitization
        const data = await apiManager.search(query, chain);
        
        // Process the response (this happens client-side)
        const processed = data.pairs?.map((pair: any) => ({
          address: pair.baseToken.address,
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name,
          price: pair.priceUsd,
        })) || [];

        setResults(processed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(searchTokens, 300);
    return () => clearTimeout(timeoutId);
  }, [query, chain]);

  return { loading, error, results };
}

export function useSecureOHLC(pairId: string, chain: string, timeframe: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!pairId || !chain || !timeframe) return;

    const fetchOHLC = async () => {
      setLoading(true);
      setError(null);

      try {
        // Direct call to external API with server-side validation
        const ohlcData = await apiManager.getOHLC({
          pairId,
          chain,
          tf: timeframe,
        });

        setData(ohlcData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch OHLC data');
      } finally {
        setLoading(false);
      }
    };

    fetchOHLC();
  }, [pairId, chain, timeframe]);

  return { loading, error, data };
}

// Example component showing the new pattern
export default function TokenSearchComponent() {
  const [query, setQuery] = useState('');
  const { loading, error, results } = useSecureSearch(query);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tokens..."
      />
      
      {loading && <div>Searching...</div>}
      {error && <div>Error: {error}</div>}
      
      <div>
        {results.map((token) => (
          <div key={token.address}>
            <strong>{token.symbol}</strong> - {token.name}
            <br />
            <small>{token.address}</small>
            <br />
            Price: ${token.price}
          </div>
        ))}
      </div>
    </div>
  );
}
