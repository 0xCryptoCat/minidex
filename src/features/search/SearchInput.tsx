import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { search as apiSearch } from '../../lib/api';
import type { SearchResult, PoolSummary } from '../../lib/types';

interface Props {
  autoFocus?: boolean;
  large?: boolean;
}

function isAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

export default function SearchInput({ autoFocus, large }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query || (!isAddress(query) && query.length < 2)) {
      setResults([]);
      setError(null);
      return;
    }
    timer.current = setTimeout(() => {
      setLoading(true);
      apiSearch(query)
        .then((data) => {
          if ('error' in data) {
            setResults([]);
            setError(data.error);
          } else {
            setResults(Array.isArray(data.results) ? data.results : []);
            setError(null);
          }
        })
        .catch(() => {
          setResults([]);
          setError('network');
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  function handleSelect(r: SearchResult) {
    const pool = r.pools.find((p) => p.gtSupported) ||
      [...r.pools].sort((a: PoolSummary, b: PoolSummary) => (b.liqUsd || 0) - (a.liqUsd || 0))[0];
    if (pool && !pool.gtSupported) {
      alert('Chart/Trades not available on this DEX; limited metrics shown.');
    }
    navigate(`/t/${r.chain}/${r.token.address}/${pool?.pairId || ''}`);
    setQuery('');
    setResults([]);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && results[0]) {
      handleSelect(results[0]);
    }
  }

  const sizeStyle = large ? { fontSize: '1.5rem', padding: '0.75rem' } : { padding: '0.5rem' };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: large ? 600 : 400 }}>
      <label htmlFor="global-search" style={{ position: 'absolute', left: -10000 }}>{
        'Search tokens or paste address'
      }</label>
      <input
        id="global-search"
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Search tokens or paste address"
        aria-label="Search tokens or paste address"
        style={{ width: '100%', ...sizeStyle }}
      />
      {error && (
        <div
          style={{ position: 'absolute', top: '100%', left: 0, fontSize: '0.75rem', color: 'var(--accent-magenta)' }}
        >
          Error
        </div>
      )}
      {!error && (loading || results.length > 0) && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--bg-elev)',
            zIndex: 50,
          }}
        >
          {loading && <li style={{ padding: '0.5rem', fontSize: '0.875rem' }}>Loading...</li>}
          {!loading &&
            results.map((r) => (
              <li key={r.token.address} style={{ padding: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleSelect(r)}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none' }}
                >
                  <strong>{r.token.symbol}</strong> {r.token.name}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
