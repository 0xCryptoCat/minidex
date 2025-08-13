import { useState, useRef, useEffect } from 'react';
import type { SearchResult, Provider, ListItem as TrendingItem } from '../../lib/types';
import { search, lists } from '../../lib/api';
import copy from '../../copy/en.json';
import SearchResultItem, { SearchResultSkeleton } from './SearchResultItem';
import ListItem, { ListItemSkeleton } from '../lists/ListItem';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<Provider | ''>('');
  const [backoff, setBackoff] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [trendingProvider, setTrendingProvider] = useState<Provider>('gt');
  const [trendingLoading, setTrendingLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (backoff > 0) {
      const t = setTimeout(() => setBackoff(backoff - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [backoff]);

  function isValid(addr: string) {
    return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
  }

  async function handleSearch(e: React.FormEvent | React.MouseEvent) {
    e.preventDefault();
    if (!isValid(query)) {
      setResults([]);
      setProvider('');
      setError('invalid_address');
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    setProvider('');
    setHasSearched(true);
    const data = await search(query);
    setLoading(false);
    if ('error' in data) {
      setResults([]);
      setError(data.error);
      setProvider(data.provider !== 'none' ? data.provider : '');
      if (data.error === 'rate_limit') setBackoff(5);
    } else {
      setResults(Array.isArray(data.results) ? data.results : []);
      const first = Array.isArray(data.results) && data.results.length > 0 ? data.results[0] : undefined;
      setProvider(first?.provider || '');
    }
  }

  async function fetchTrending() {
    setTrendingLoading(true);
    const data = await lists({ chain: 'ethereum', type: 'trending', window: '1d', limit: 10 });
    setTrendingLoading(false);
    if ('error' in data) {
      setTrending([]);
    } else {
      setTrending(data.items);
      setTrendingProvider(data.provider);
    }
  }

  useEffect(() => {
    if ((!hasSearched && !error) || (hasSearched && results.length === 0 && !loading && !error)) {
      if (trending.length === 0 && !trendingLoading) fetchTrending();
    }
  }, [hasSearched, results, loading, error]);

  return (
    <div style={{ padding: '1rem' }}>
      <form onSubmit={handleSearch} style={{ marginBottom: '0.5rem' }}>
        <label htmlFor="search-input" style={{ position: 'absolute', left: '-10000px' }}>
          {copy.search_placeholder}
        </label>
        <input
          id="search-input"
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (error === 'invalid_address') setError(null);
          }}
          placeholder={copy.search_placeholder}
          aria-label={copy.search_placeholder}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </form>
      {error === 'invalid_address' && (
        <div style={{ color: 'red', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          {copy.error_invalid_address}
        </div>
      )}
      {error && error !== 'invalid_address' && (
        <div className="error-banner">
          <span>
            {error === 'rate_limit'
              ? `${copy.error_rate_limit}${backoff > 0 ? ` (${backoff})` : ''}`
              : copy.error_upstream}
          </span>
          {error === 'upstream_error' && (
            <button onClick={handleSearch}>{copy.retry}</button>
          )}
        </div>
      )}
      {results.length > 0 && (
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {copy.results}
          {provider && (
            <span className="provider-badge" aria-label={`data provider ${provider}`}>
              {provider}
            </span>
          )}
        </h2>
      )}
      {(loading || results.length > 0) && (
        <table className="search-results-table">
          <colgroup>
            <col style={{ width: '40px' }} />
            <col />
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
          </colgroup>
          <thead>
            <tr>
              <th></th>
              <th>Token</th>
              <th>Chain</th>
              <th>Price</th>
              <th>Liq</th>
              <th>Vol24h</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SearchResultSkeleton key={i} />)
              : results.map((r) => (
                  <SearchResultItem key={r.token.address + r.chain} result={r} />
                ))}
          </tbody>
        </table>
      )}
      {!loading && hasSearched && results.length === 0 && !error && (
        <div className="no-results">{copy.no_results}</div>
      )}
      {!error && (!hasSearched || (hasSearched && results.length === 0 && !loading)) && (
        <section className="trending-section">
          <h2>{copy.trending_tokens}</h2>
          <div style={{ border: '1px solid #ccc' }}>
            {trendingLoading
              ? Array.from({ length: 5 }).map((_, i) => <ListItemSkeleton key={i} />)
              : Object.entries(
                  trending.reduce((acc: Record<string, TrendingItem[]>, it) => {
                    (acc[it.chain] = acc[it.chain] || []).push(it);
                    return acc;
                  }, {})
                ).map(([c, items]) => (
                  <div key={c} style={{ paddingBottom: '0.5rem' }}>
                    <h3 style={{ margin: '0.5rem' }}>{c}</h3>
                    {items.map((item, idx) => (
                      <ListItem
                        key={item.pairId}
                        item={item}
                        rank={idx + 1}
                        provider={trendingProvider}
                      />
                    ))}
                  </div>
                ))}
          </div>
        </section>
      )}
    </div>
  );
}

