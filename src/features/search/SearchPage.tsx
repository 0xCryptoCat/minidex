import { useState, useRef, useEffect } from 'react';
import type { SearchResult, Provider } from '../../lib/types';
import { search } from '../../lib/api';
import copy from '../../copy/en.json';
import SearchResultItem, { SearchResultSkeleton } from './SearchResultItem';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<Provider | ''>('');
  const [backoff, setBackoff] = useState(0);
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
      setResults(null);
      setProvider('');
      setError('invalid_address');
      return;
    }
    setLoading(true);
    setError(null);
    setProvider('');
    const data = await search(query);
    setLoading(false);
    if ('error' in data) {
      setResults(null);
      setError(data.error);
      setProvider(data.provider !== 'none' ? data.provider : '');
      if (data.error === 'rate_limit') setBackoff(5);
    } else {
      setResults(data.results);
      setProvider(data.results[0]?.provider || '');
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
        <div style={{
          background: '#fee',
          color: '#900',
          padding: '0.5rem',
          marginBottom: '0.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
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
      {provider && (
        <div style={{ marginBottom: '0.5rem' }}>
          <span
            aria-label={`data provider ${provider}`}
            style={{ fontSize: '0.75rem', border: '1px solid #999', padding: '0 0.25rem' }}
          >
            {provider}
          </span>
        </div>
      )}
      {(loading || (results && results.length > 0)) && (
        <div style={{ border: '1px solid #ccc' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 80px 80px 80px 80px 80px 60px',
              gap: '0.5rem',
              padding: '0.5rem',
              fontWeight: 'bold',
              position: 'sticky',
              top: 0,
              background: '#fff'
            }}
          >
            <div></div>
            <div>Token</div>
            <div>Chain</div>
            <div>Price</div>
            <div>Liq</div>
            <div>Vol24h</div>
            <div>%</div>
            <div>Pools</div>
          </div>
          {loading && Array.from({ length: 5 }).map((_, i) => <SearchResultSkeleton key={i} />)}
          {!loading &&
            results &&
            results.map((r) => (
              <SearchResultItem key={r.token.address + r.chain} result={r} />
            ))}
        </div>
      )}
      {!loading && results && results.length === 0 && <div>{copy.no_results}</div>}
    </div>
  );
}

