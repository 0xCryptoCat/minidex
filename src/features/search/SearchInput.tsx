import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentPaste as PasteIcon } from '@mui/icons-material';
import { search as apiSearch } from '../../lib/api';
import type { SearchTokenSummary, PoolSummary } from '../../lib/types';
import { getChainIcon, getDexIcon } from '../../lib/icons';
import { formatUsd, formatCompact } from '../../lib/format';

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
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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
      setHasError(false);
      setErrorMessage('');
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    
    apiSearch(q, undefined, controller.signal)
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        
        if ('results' in data) {
          const searchResults = Array.isArray(data.results) ? data.results : [];
          setResults(searchResults);
          
          // Only show error if this was a forced search (Enter pressed) and no results
          if (searchResults.length === 0 && q.length > 0 && force) {
            setHasError(true);
            setErrorMessage(isAddress(q) ? 'Token address not found' : 'No tokens found matching your search');
          }
        } else {
          setResults([]);
          setHasError(true);
          setErrorMessage('Search failed. Please try again.');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          setResults([]);
          setHasError(true);
          setErrorMessage('Search error. Please check your connection.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });
  }

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    
    if (isAddress(query)) {
      runSearch(query);
      return;
    }
    
    if (query.length >= 4) {
      timer.current = setTimeout(() => runSearch(query), 500);
    } else {
      setResults([]);
      setIsLoading(false);
      setHasError(false);
      setErrorMessage('');
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

  async function handlePasteButton() {
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
    fontSize: '1rem',
    padding: 'var(--space-4)',
    borderRadius: 'var(--radius-pill)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    transition: 'all var(--transition-fast)',
    outline: 'none',
  } : {
    width: '100%',
    fontSize: '1rem',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-pill)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    transition: 'all var(--transition-fast)',
    outline: 'none',
  };

  return (
    <div style={containerStyle}>
      <label htmlFor="global-search" style={{ position: 'absolute', left: -10000 }}>
        {'Search tokens with address'}
      </label>
      <div className="search-input-container">
        <input
          id="global-search"
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onPaste={handlePaste}
          placeholder="Search tokens with address"
          aria-label="Search tokens with address"
          className={`search-input-enhanced ${hasError ? 'search-input-error' : ''} ${isLoading ? 'search-loading' : ''}`}
          style={{
            ...inputStyle,
            ...(query ? {
              borderColor: hasError ? '#ef4444' : 'var(--telegram-blue)',
              background: 'var(--bg-elev)',
            } : {}),
            ...((results.length > 0 || isLoading || hasError) ? {
              borderRadius: 'var(--radius) var(--radius) 0 0',
            } : {}),
            paddingRight: '50px'
          }}
        />
        <button
          type="button"
          onClick={handlePasteButton}
          className="search-paste-button"
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}
          aria-label="Paste from clipboard"
          title="Paste from clipboard"
        >
          <PasteIcon fontSize="inherit" />
        </button>
        <div className="search-status-indicator">
          {hasError && !isLoading && (
            <span style={{ color: '#ef4444', fontSize: '16px' }}>⚠️</span>
          )}
        </div>
      </div>
      
      {hasError && errorMessage && (
        <div className="search-error-message">
          {errorMessage}
        </div>
      )}
      
      {(results.length > 0 || isLoading) && !hasError && (
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
            maxHeight: '400px',
            overflow: 'auto',
          }}
        >
          {isLoading ? (
            <div style={{ 
              padding: 'var(--space-3)', 
              color: 'var(--text-muted)',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: 16,
                height: 16,
                border: '2px solid #ddd',
                borderTop: '2px solid var(--telegram-blue)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
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
                  padding: 'var(--space-4)',
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
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div className="token-icon-container" style={{ borderRadius: '10px' }}>
                    {r.icon ? (
                      <img 
                        src={r.icon ? r.icon : 'https://placehold.co/36x36/black/gray/?text=?'} 
                        alt={`${r.symbol}`} 
                        className="token-icon"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`token-fallback ${r.icon ? 'hidden' : ''}`}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '25px',
                        display: r.icon ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img 
                        src={`https://placehold.co/36x36/black/white?text=${r.symbol?.[0]?.toUpperCase() || 'T'}`}
                        alt={`${r.symbol} placeholder`}
                        style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                        {r.symbol}
                      </span>
                      {r.chainIcons && r.chainIcons.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {r.chainIcons.slice(0, 3).map((chain, i) => (
                            <img 
                              key={chain}
                              src={getChainIcon(chain)} 
                              alt={chain}
                              style={{ 
                                width: 16, 
                                height: 16, 
                                borderRadius: '50%', 
                                border: '1px solid var(--border)' 
                              }}
                            />
                          ))}
                          {r.chainCount && r.chainCount > 3 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                              +{r.chainCount - 3}
                            </span>
                          )}
                        </div>
                      )}
                      {r.pools && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                          {Array.from(new Set(r.pools.map(p => p.dex).filter(Boolean))).slice(0, 3).map((dex, i) => (
                            <img 
                              key={dex}
                              src={getDexIcon(dex)} 
                              alt={dex}
                              title={dex}
                              style={{ 
                                width: 14, 
                                height: 14, 
                                borderRadius: '50%', 
                                border: '1px solid var(--border)',
                                marginLeft: i > 0 ? '-4px' : '0',
                                zIndex: 10 - i
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {r.name}
                    </div>
                    {r.pools && r.pools.length > 0 && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>{r.pools.length} pool{r.pools.length !== 1 ? 's' : ''}</span>
                        {r.liqUsd && (
                          <span>• TVL: {formatUsd(r.liqUsd, { compact: true })}</span>
                        )}
                        {r.vol24hUsd && (
                          <span>• Vol: {formatUsd(r.vol24hUsd, { compact: true })}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 500,
                    color: 'var(--text)',
                    textAlign: 'right',
                    minWidth: '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '2px'
                  }}>
                    <span>{formatUsd(r.priceUsd, { dp: 6 })}</span>
                    {r.priceChange24h !== undefined && r.priceChange24h !== 0 && (
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: r.priceChange24h >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        {r.priceChange24h >= 0 ? '+' : ''}{r.priceChange24h.toFixed(2)}%
                      </span>
                    )}
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

