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
        gap: 'calc(var(--padding) / 2)',
        padding: 'var(--padding)',
      }}
    >
      <SearchInput autoFocus large />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Search tokens or paste address</p>
    </div>
  );
}

