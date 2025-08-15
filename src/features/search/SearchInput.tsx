import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { search as apiSearch } from '../../lib/api';
import type { SearchTokenSummary, PoolSummary } from '../../lib/types';

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
  const [results, setResults] = useState<SearchTokenSummary[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function runSearch(q: string) {
    if (!q || (!isAddress(q) && q.length < 4)) {
      setResults([]);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    apiSearch(q, undefined, controller.signal)
      .then((data) => {
        if ('results' in data) {
          setResults(Array.isArray(data.results) ? data.results : []);
        } else {
          setResults([]);
        }
      })
      .catch(() => setResults([]));
  }

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (isAddress(query)) {
      runSearch(query);
      return () => {};
    }
    if (query.length >= 4) {
      timer.current = setTimeout(() => runSearch(query), 500);
    } else {
      setResults([]);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

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

  function handleSelect(r: SearchTokenSummary) {
    const pool =
      r.pools?.find((p) => p.gtSupported) ||
      [...(r.pools || [])].sort(
        (a: PoolSummary, b: PoolSummary) => (b.liqUsd || 0) - (a.liqUsd || 0)
      )[0];
    navigate(
      `/t/${pool?.chain || ''}/${r.address}/${pool?.pairId || ''}?poolAddress=${
        pool?.poolAddress || ''
      }`
    );
    setQuery('');
    setResults([]);
  }

  const sizeStyle = large ? { fontSize: '1.5rem', padding: '0.75rem' } : { padding: '0.5rem' };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: large ? 600 : 400 }}>
      <label htmlFor="global-search" style={{ position: 'absolute', left: -10000 }}>
        {'Search tokens or paste address'}
      </label>
      <input
        id="global-search"
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKey}
        onPaste={handlePaste}
        placeholder="Search tokens or paste address"
        aria-label="Search tokens or paste address"
        style={{ width: '100%', ...sizeStyle }}
      />
      {results.length > 0 && (
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
          {results.map((r) => (
            <li key={r.address} style={{ padding: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleSelect(r)}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none' }}
              >
                <strong>{r.symbol}</strong> {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

