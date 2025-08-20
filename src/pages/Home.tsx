import SearchInput from '../features/search/SearchInput';
import FeatureCarousel from '../components/FeatureCarousel';
import TechStack from '../components/TechStack';

// Home page component with mobile keyboard handling
export default function Home() {
  return (
    <div 
      style={{ 
        
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        // Use CSS custom property for dynamic viewport
        minHeight: 'calc(var(--vh, 1vh) * 100)',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 'var(--space-6)',
          padding: 'var(--space-4)',
          paddingTop: 'max(var(--space-8), 10vh)', // Push content down from top
          background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-elev) 100%)',
          overflow: 'visible',
          // Prevent viewport issues on mobile
          position: 'relative',
        }}
        className="home-content"
      >
      {/* Logo and Brand */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/logo.svg" 
            alt="SmallDEX" 
            style={{ height: 48, width: 'auto' }}
          />
          <h1 
            style={{ 
              fontSize: '3rem', 
              fontWeight: 800, 
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
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '1.125rem',
          margin: 'var(--space-2) 0 0 0',
          fontWeight: 500,
        }}>
          The Telegram DEX App
        </p>
      </div>

      {/* Search Section */}
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <SearchInput autoFocus large />
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '0.875rem',
          textAlign: 'center',
          margin: 'var(--space-3) 0 0 0',
        }}>
          
        </p>
      </div>

      {/* Feature Carousel */}
      <FeatureCarousel />

      {/* Tech Stack */}
      <TechStack />

      </div>
    </div>
  );
}

