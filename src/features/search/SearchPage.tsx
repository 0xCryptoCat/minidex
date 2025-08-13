import { useState, useRef, useEffect } from 'react';
import type { SearchResult } from '../../lib/types';
import { search } from '../../lib/api';
import copy from '../../copy/en.json';
import SearchResultItem from './SearchResultItem';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const data = await search(query);
    setLoading(false);
    if ('error' in data) {
      setResults(null);
      setError(data.error);
    } else {
      setResults(data.results);
    }
  }

  return (
    <div style={{ padding: '1rem' }}>
      <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
        <input
          id="search-input"
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.search_placeholder}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </form>
      {loading && <div>{copy.loading}</div>}
      {error && (
        <div style={{ color: 'red' }}>
          {error === 'invalid_address'
            ? copy.error_invalid_address
            : error === 'rate_limit'
            ? copy.error_rate_limit
            : copy.error_generic}
        </div>
      )}
      {!loading && results && results.length === 0 && <div>{copy.no_results}</div>}
      {!loading && results && results.map((r) => <SearchResultItem key={r.token.address + r.chain} result={r} />)}
    </div>
  );
}

