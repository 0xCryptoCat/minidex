import SearchInput from '../features/search/SearchInput';
import { useProvider } from '../lib/provider';

export default function Header() {
  const { provider } = useProvider();
  return (
    <header className="header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ flex: 1 }} />
      <div style={{ flex: 2, maxWidth: 600 }}>
        <SearchInput />
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {provider && (
          <span className="provider-badge" aria-label={`data provider ${provider}`}>
            {provider}
          </span>
        )}
      </div>
    </header>
  );
}
