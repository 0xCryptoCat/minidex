import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { search as apiSearch } from '../lib/api';
import type { SearchResult } from '../lib/types';

export default function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const first = menuRef.current?.querySelector<HTMLElement>('a, button');
    first?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      } else if (e.key === 'Tab' && menuRef.current) {
        const focusables = menuRef.current.querySelectorAll<HTMLElement>('a, button');
        if (focusables.length === 0) return;
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  function handleSearchClick() {
    setSearchOpen(true);
  }

  useEffect(() => {
    if (!searchOpen) return;
    inputRef.current?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSearchOpen(false);
      } else if (e.key === 'Tab' && searchRef.current) {
        const focusables = searchRef.current.querySelectorAll<HTMLElement>('input, button');
        if (focusables.length === 0) return;
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchOpen]);

  function isValid(addr: string) {
    return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid(query)) {
      setError('invalid');
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    const data = await apiSearch(query);
    setLoading(false);
    if ('error' in data) {
      setResults([]);
      setError(data.error);
    } else {
      setResults(Array.isArray(data.results) ? data.results : []);
    }
  }

  function handleResultClick(r: SearchResult) {
    const pairId = r.pools[0]?.pairId || '';
    navigate(`/t/${r.chain}/${r.token.address}/${pairId}`);
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  }

  return (
    <header className="header">
      <button
        type="button"
        className="menu-btn"
        aria-label="Menu"
        aria-expanded={menuOpen}
        aria-controls="main-menu"
        onClick={() => setMenuOpen((o) => !o)}
      >
        ☰
      </button>
      <button
        type="button"
        className="search-pill"
        onClick={handleSearchClick}
        aria-label="Search"
        aria-expanded={searchOpen}
        aria-haspopup="dialog"
      >
        Search
      </button>
      {searchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          ref={searchRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ background: '#fff', padding: '1rem', minWidth: '300px' }}>
            <form onSubmit={handleSearch} style={{ marginBottom: '0.5rem' }}>
              <label htmlFor="quick-search-input" style={{ position: 'absolute', left: '-10000px' }}>
                Search
              </label>
              <input
                id="quick-search-input"
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setError(null);
                }}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </form>
            {error === 'invalid' && (
              <div style={{ color: 'red', fontSize: '0.875rem' }}>Invalid address</div>
            )}
            {loading && <div style={{ fontSize: '0.875rem' }}>Loading...</div>}
            {!loading && results.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {results.map((r) => (
                  <li key={r.token.address} style={{ marginBottom: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleResultClick(r)}
                      style={{ width: '100%', textAlign: 'left' }}
                    >
                      <strong>{r.token.symbol}</strong> {r.token.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!loading && results.length === 0 && !error && (
              <div style={{ fontSize: '0.875rem' }}>No results</div>
            )}
            <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
              <button type="button" onClick={() => setSearchOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {menuOpen && (
        <nav id="main-menu" ref={menuRef} className="menu-sheet" aria-label="Main menu">
          <ul>
            <li>
              <a
                href="https://github.com/smol-ai/minidex"
                target="_blank"
                rel="noopener noreferrer"
              >
                Source Code
              </a>
            </li>
            <li>
              <a
                href="https://github.com/smol-ai/minidex#readme"
                target="_blank"
                rel="noopener noreferrer"
              >
                Docs
              </a>
            </li>
            <li>
              <button type="button" onClick={() => setMenuOpen(false)}>
                Close
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
