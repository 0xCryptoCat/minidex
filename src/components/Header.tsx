import { useNavigate, useLocation } from 'react-router-dom';
import SearchInput from '../features/search/SearchInput';
import { useProvider } from '../lib/provider';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  
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
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        <img 
          src="/logo.svg" 
          alt="SmallDEX" 
          style={{ height: 32, width: 'auto' }}
        />
      </div>
      
      <div className="header-search-container">
        <SearchInput />
      </div>
    </header>
  );
}
