import { useState, useRef, useEffect } from 'react';
import type { SearchTokenSummary, Provider } from '../../lib/types';
import { search } from '../../lib/api';
import copy from '../../copy/en.json';
import SearchResultItem, { SearchResultSkeleton } from './SearchResultItem';
import '../../styles/search.css';

function isAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchTokenSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [provider, setProvider] = useState<Provider | ''>('');
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query) {
      setResults([]);
      setProvider('');
      return;
    }
    if (isAddress(query)) {
      runSearch(query);
      return;
    }
    if (query.length >= 4) {
      timer.current = setTimeout(() => runSearch(query), 500);
    } else {
      setResults([]);
      setProvider('');
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  async function runSearch(q: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(false);
    setHasSearched(true);
    try {
      const { data } = await search(q, undefined, controller.signal);
      setLoading(false);
      if ('results' in data) {
        const res = Array.isArray(data.results) ? data.results : [];
        res.forEach((r) => {
          r.pools?.sort((a, b) => {
            const sup = Number(!!b.gtSupported) - Number(!!a.gtSupported);
            if (sup !== 0) return sup;
            return (b.liqUsd || 0) - (a.liqUsd || 0);
          });
          (r as any).gtSupported = r.pools?.some((p) => p.gtSupported);
        });
        const sorted = res.sort((a, b) => {
          if ((a as any).gtSupported === (b as any).gtSupported) {
            return (b.liqUsd || 0) - (a.liqUsd || 0);
          }
          return (a as any).gtSupported ? -1 : 1;
        });
        setResults(sorted);
        const first = sorted[0];
        setProvider(first?.provider || '');
      } else {
        setError(true);
        setResults([]);
        setProvider('');
      }
    } catch {
      if (controller.signal.aborted) return;
      setLoading(false);
      setError(true);
      setResults([]);
      setProvider('');
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (timer.current) clearTimeout(timer.current);
      runSearch(query);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const value = target.value;
    const newValue = value.slice(0, start) + pasted + value.slice(end);
    setQuery(newValue);
    if (timer.current) clearTimeout(timer.current);
    runSearch(newValue);
  }

  return (
    <div style={{ padding: '1rem' }}>
      <label htmlFor="search-input" style={{ position: 'absolute', left: '-10000px' }}>
        {copy.search_placeholder}
      </label>
      <input
        id="search-input"
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setError(false);
        }}
        onKeyDown={handleKey}
        onPaste={handlePaste}
        placeholder={copy.search_placeholder}
        aria-label={copy.search_placeholder}
        style={{ width: '100%', padding: '0.5rem' }}
      />
      {error && (
        <div className="error-banner">Search failed—try again</div>
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
              <th>Price</th>
              <th>Liq</th>
              <th>Vol24h</th>
              <th>Chains</th>
              <th>Pools</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SearchResultSkeleton key={i} />)
              : results.map((r) => <SearchResultItem key={r.address} result={r} />)}
          </tbody>
        </table>
      )}
      {!loading && hasSearched && results.length === 0 && !error && (
        <div className="no-results">
          No results
          <br />
          Addresses must be full 42-char checksummed or lowercase.
        </div>
      )}
    </div>
  );
}
