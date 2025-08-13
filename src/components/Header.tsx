import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    navigate('/');
    setTimeout(() => {
      const input = document.getElementById('search-input') as HTMLInputElement | null;
      input?.focus();
    }, 0);
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
      <button type="button" className="search-pill" onClick={handleSearchClick} aria-label="Search">
        Search
      </button>
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
