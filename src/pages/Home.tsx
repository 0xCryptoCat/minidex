import SearchInput from '../features/search/SearchInput';

export default function Home() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '1rem',
      }}
    >
      <SearchInput autoFocus large />
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Search tokens or paste address</p>
    </div>
  );
}

