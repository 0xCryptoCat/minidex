import SearchInput from '../features/search/SearchInput';
import { ElectricBolt, MobileFriendly, Polyline } from '@mui/icons-material';

export default function Home() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-6)',
        padding: 'var(--space-4)',
        background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-elev) 100%)',
      }}
    >
      {/* Logo and Brand */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
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
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '1.125rem',
          margin: 'var(--space-2) 0 0 0',
          fontWeight: 500,
        }}>
          Your pocket-sized DEX terminal
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
          Search tokens by address or name
        </p>
      </div>

      {/* Feature highlights */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
        width: '100%',
        maxWidth: '800px',
        marginTop: 'var(--space-6)',
      }}>
        <div className="card-compact" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>
            <ElectricBolt sx={{ fontSize: 48 }} />
          </div>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            margin: '0 0 var(--space-1) 0',
            color: 'var(--text)',
          }}>
            Lightning Fast
          </h3>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-muted)', 
            margin: 0,
            lineHeight: 1.4,
          }}>
            Real-time data from multiple DEX sources
          </p>
        </div>

        <div className="card-compact" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>
            <MobileFriendly sx={{ fontSize: 48 }} />
          </div>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            margin: '0 0 var(--space-1) 0',
            color: 'var(--text)',
          }}>
            Mobile First
          </h3>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-muted)', 
            margin: 0,
            lineHeight: 1.4,
          }}>
            Optimized for Telegram in-app use
          </p>
        </div>

        <div className="card-compact" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>
            <Polyline sx={{ fontSize: 48 }} />
          </div>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            margin: '0 0 var(--space-1) 0',
            color: 'var(--text)',
          }}>
            Multi-Chain
          </h3>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-muted)', 
            margin: 0,
            lineHeight: 1.4,
          }}>
            Support for all major networks
          </p>
        </div>
      </div>

      {/* Footer info */}
      <div style={{ 
        position: 'absolute',
        bottom: 'var(--space-6)',
        color: 'var(--text-disabled)',
        fontSize: '0.75rem',
        textAlign: 'center',
      }}>
        Powered by: <img src="https://s.geckoterminal.com/_next/static/media/logo_symbol.d6e8a303.svg" alt="GeckoTerminal" style={{ height: '1em' }} /> & <img src="https://docs.dexscreener.com/~gitbook/image?url=https%3A%2F%2F198140802-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F7OmRM9NOmlC1POtFwsnX%252Ficon%252F6BJXvNUMQSXAtDTzDyBK%252Ficon-512x512.png%3Falt%3Dmedia%26token%3Da7ce263e-0b40-4afb-ae25-eae378aef0ab&width=32&dpr=2&quality=100&sign=f988708e&sv=2" alt="DexScreener" style={{ height: '1em' }} />
      </div>
    </div>
  );
}

