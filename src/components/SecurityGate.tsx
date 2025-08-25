import { ReactNode } from 'react';
import { useTelegramAuth } from '../lib/useTelegramAuth';
import ChartLoader from './ChartLoader';

interface SecurityGateProps {
  children: ReactNode;
}

export default function SecurityGate({ children }: SecurityGateProps) {
  const { loading, isValidTelegram, isGroupMember, error, user, groupCheckLoading } = useTelegramAuth();

  // Show loading state while checking authentication
  if (loading || groupCheckLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--text)',
        padding: 'var(--space-4)',
      }}>
        <img 
          src="/logo.svg" 
          alt="SmallDEX" 
          style={{ height: 64, width: 'auto', marginBottom: 'var(--space-4)' }}
        />
        <ChartLoader message={loading ? "Verifying access..." : "Checking permissions..."} />
        {user && (
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '14px', 
            textAlign: 'center',
            marginTop: 'var(--space-4)' 
          }}>
            Welcome, {user.first_name}!
          </p>
        )}
      </div>
    );
  }

  // Show error state for unauthorized access
  if (error || !isValidTelegram || isGroupMember === false) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--text)',
        padding: 'var(--space-4)',
        textAlign: 'center',
      }}>
        <img 
          src="/logo.svg" 
          alt="SmallDEX" 
          style={{ height: 64, width: 'auto', marginBottom: 'var(--space-4)' }}
        />
        
        <div style={{
          maxWidth: '400px',
          padding: 'var(--space-6)',
          background: 'var(--bg-elev)',
          borderRadius: 'var(--radius-large)',
          border: '1px solid var(--border)',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: '0 0 var(--space-4) 0',
            color: 'var(--error)',
          }}>
            Access Restricted
          </h2>
          
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '16px',
            lineHeight: 1.5,
            margin: '0 0 var(--space-4) 0',
          }}>
            {!isValidTelegram 
              ? "This application can only be accessed through Telegram."
              : isGroupMember === false
              ? "You need to join our private Beta Test group to access this application."
              : error || "Unable to verify access permissions."
            }
          </p>

          {user && (
            <div style={{
              padding: 'var(--space-3)',
              background: 'var(--bg-elev-2)',
              borderRadius: 'var(--radius)',
              marginBottom: 'var(--space-4)',
            }}>
              <p style={{ 
                color: 'var(--text-muted)', 
                fontSize: '14px', 
                margin: 0 
              }}>
                Authenticated as: <strong>{user.first_name}</strong>
                {user.username && ` (@${user.username})`}
              </p>
            </div>
          )}
          
          <div style={{
            padding: 'var(--space-3)',
            background: 'var(--bg)',
            borderRadius: 'var(--radius)',
            fontSize: '14px',
            color: 'var(--text-muted)',
          }}>
            <p style={{ margin: 0 }}>
              Please ensure you're opening this app through the official Telegram bot
              {isGroupMember === false && " and have joined the required community group"}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication successful - render the main app
  return <>{children}</>;
}
