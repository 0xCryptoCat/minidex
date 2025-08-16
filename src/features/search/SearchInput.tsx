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
  const [isLoading, setIsLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function runSearch(q: string, force = false) {
    if (!q || (!force && !isAddress(q) && q.length < 4)) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    
    apiSearch(q, undefined, controller.signal)
      .then(({ data }) => {
        if ('results' in data) {
          setResults(Array.isArray(data.results) ? data.results : []);
        } else {
          setResults([]);
        }
      })
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
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
      setIsLoading(false);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (timer.current) clearTimeout(timer.current);
      runSearch(query, true);
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
    runSearch(newValue, true);
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

  const containerStyle = large ? {
    position: 'relative' as const,
    width: '100%',
    maxWidth: 600
  } : {
    position: 'relative' as const,
    width: '100%',
    maxWidth: 400
  };

  const inputStyle = large ? {
    width: '100%',
    fontSize: '1.125rem',
    padding: 'var(--space-4)',
    borderRadius: 'var(--radius-pill)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    transition: 'all var(--transition-fast)',
    outline: 'none',
  } : {
    width: '100%',
    fontSize: '1rem',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-pill)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    transition: 'all var(--transition-fast)',
    outline: 'none',
  };

  return (
    <div style={containerStyle}>
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
        style={{
          ...inputStyle,
          ...(query ? {
            borderColor: 'var(--telegram-blue)',
            background: 'var(--bg-elev)',
          } : {}),
          ...((results.length > 0 || isLoading) ? {
            borderRadius: large ? 'var(--radius-pill) var(--radius-pill) 0 0' : 'var(--radius-pill) var(--radius-pill) 0 0'
          } : {})
        }}
      />
      
      {(results.length > 0 || isLoading) && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderRadius: `0 0 var(--radius) var(--radius)`,
            boxShadow: 'var(--shadow-medium)',
            zIndex: 50,
            maxHeight: '300px',
            overflow: 'auto',
          }}
        >
          {isLoading ? (
            <div style={{ 
              padding: 'var(--space-3)', 
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}>
              Searching...
            </div>
          ) : (
            results.map((r) => (
              <button
                key={r.address}
                type="button"
                onClick={() => handleSelect(r)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: 'var(--space-3)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                  borderBottom: '1px solid var(--separator)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {r.icon && (
                    <img 
                      src={r.icon} 
                      alt={`${r.symbol} logo`} 
                      style={{ width: 24, height: 24, borderRadius: '50%' }} 
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                      {r.symbol}
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--text-muted)',
                    }}>
                      {r.name}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)',
                    textAlign: 'right',
                  }}>
                    ${r.priceUsd?.toFixed(4) || '—'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

