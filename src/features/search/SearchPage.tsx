import { useState, useRef, useEffect } from 'react';
import type { SearchResult, Provider } from '../../lib/types';
import { search } from '../../lib/api';
import copy from '../../copy/en.json';
import SearchResultItem, { SearchResultSkeleton } from './SearchResultItem';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<Provider | ''>('');
  const [backoff, setBackoff] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
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
      const res = Array.isArray(data.results) ? data.results : [];
      res.forEach((r) =>
        r.pools.sort((a, b) => {
          const sup = Number(!!b.gtSupported) - Number(!!a.gtSupported);
          if (sup !== 0) return sup;
          return (b.liqUsd || 0) - (a.liqUsd || 0);
        })
      );
      const sorted = res.sort((a, b) => {
        const aSup = a.pools.some((p) => p.gtSupported);
        const bSup = b.pools.some((p) => p.gtSupported);
        if (aSup === bSup) {
          const aL = a.pools[0]?.liqUsd || 0;
          const bL = b.pools[0]?.liqUsd || 0;
          return bL - aL;
        }
        return aSup ? -1 : 1;
      });
      setResults(sorted);
      const first = sorted[0];
      setProvider(first?.provider || '');
    }
  }

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
          <thead>
            <tr style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
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
      {/* Trending section removed for now */}
    </div>
  );
}

