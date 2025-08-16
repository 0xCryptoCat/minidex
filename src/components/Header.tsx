import { useNavigate, useLocation } from 'react-router-dom';
import SearchInput from '../features/search/SearchInput';
import { useProvider } from '../lib/provider';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { provider } = useProvider();
  
  // Don't show header on home/search page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <header className="header">
      <div 
        className="header-logo"
        onClick={() => navigate('/')}
        style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700,
          color: 'var(--telegram-blue)',
          cursor: 'pointer'
        }}
      >
        SmallDEX
      </div>
      
      <div className="header-search-container">
        <SearchInput />
      </div>
      
      <div className="header-provider">
        {provider && (
          <span className="provider-badge" aria-label={`data provider ${provider}`}>
            {provider}
          </span>
        )}
      </div>
    </header>
  );
}
