import SearchInput from '../features/search/SearchInput';

export default function Header() {
  return (
    <header className="header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: 24 }} />
      <div style={{ flex: 1 }}>
        <SearchInput />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <a href="https://github.com/smol-ai/minidex" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href="https://github.com/smol-ai/minidex#readme" target="_blank" rel="noopener noreferrer">
          Docs
        </a>
      </div>
    </header>
  );
}
