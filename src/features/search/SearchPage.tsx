import { useState, useRef, useEffect } from 'react';
import { ContentPaste as PasteIcon } from '@mui/icons-material';
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
  const [errorMessage, setErrorMessage] = useState('');
  const [provider, setProvider] = useState<Provider | ''>('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query) {
      setResults([]);
      setProvider('');
      setError(false);
      setErrorMessage('');
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
      setError(false);
      setErrorMessage('');
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [query]);

  async function runSearch(q: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(false);
    setErrorMessage('');
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
        
        if (sorted.length === 0 && q.length > 0) {
          setError(true);
          setErrorMessage(isAddress(q) ? 'Token address not found' : 'No tokens found matching your search');
        } else {
          const first = sorted[0];
          setProvider(first?.provider || '');
        }
      } else {
        setResults([]);
        setError(true);
        setErrorMessage('Search failed. Please try again.');
      }
    } catch (err: any) {
      setLoading(false);
      if (err.name !== 'AbortError') {
        setError(true);
        setErrorMessage('Search error. Please check your connection.');
        setResults([]);
        setProvider('');
      }
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (timer.current) clearTimeout(timer.current);
      runSearch(query);
    }
  }

  // Handle paste click - try to read clipboard text
  async function handlePasteClick() {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setQuery(text.trim());
        if (inputRef.current) {
          inputRef.current.focus();
          // Position cursor at end of pasted text
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(text.trim().length, text.trim().length);
            }
          }, 0);
        }
      }
    } catch (err) {
      console.warn('Failed to read clipboard:', err);
      // Fallback: try to use the legacy execCommand method
      try {
        if (inputRef.current) {
          inputRef.current.focus();
          document.execCommand('paste');
        }
      } catch (fallbackErr) {
        console.warn('Fallback paste failed:', fallbackErr);
      }
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
      {/* Logo and Title Header */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-6)',
        paddingTop: 'var(--space-4)',
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center'}}>
          <img 
            src="/logo.svg" 
            alt="SmallDEX" 
            style={{ height: 48 }}
          />
          <h1 
            style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              margin: 0,
              background: 'linear-gradient(135deg, var(--telegram-blue) 0%, var(--brand-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            SmallDEX
          </h1>
        </div>  
      </div>

      <label htmlFor="search-input" style={{ position: 'absolute', left: '-10000px' }}>
        {copy.search_placeholder}
      </label>
      
      {/* Search input with paste button */}
      <div className="search-input-container" style={{ position: 'relative', width: '100%' }}>
        <input
          id="search-input"
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(false);
            setErrorMessage('');
            
            // Show typing indicator
            setIsTyping(true);
            if (typingTimer.current) clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => setIsTyping(false), 1000);
          }}
          onKeyDown={handleKey}
          onPaste={handlePaste}
          placeholder={copy.search_placeholder}
          aria-label={copy.search_placeholder}
          className={error ? 'search-input-error' : ''}
          style={{ 
            width: '100%', 
            padding: '0.75rem',
            paddingRight: !query || loading ? '3rem' : '0.75rem', // Make room for paste button
            fontSize: '1rem',
            borderRadius: 'var(--radius)',
            border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
            background: 'var(--bg)',
            color: 'var(--text)',
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
        />
        
        {/* Paste button - only show when input is empty and not loading and not typing */}
        {!query && !loading && !isTyping && (
          <button
            onClick={handlePasteClick}
            className="search-paste-button"
            title="Paste from clipboard"
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-telegram)';
              e.currentTarget.style.background = 'var(--bg-elev)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'none';
            }}
          >
            <PasteIcon sx={{ fontSize: 18 }} />
          </button>
        )}
      </div>
      {error && errorMessage && (
        <div className="search-error-message">
          {errorMessage}
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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          marginTop: 'var(--space-4)',
        }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            Token not found
          </div>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
            Make sure addresses are full 42-character checksummed format.
          </div>
        </div>
      )}
    </div>
  );
}
