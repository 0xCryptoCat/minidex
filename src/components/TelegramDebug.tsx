import { useTelegramAuth } from '../lib/useTelegramAuth';

export default function TelegramDebug() {
  const auth = useTelegramAuth();

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      background: 'var(--bg-elev)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: 'var(--space-2)',
      fontSize: '12px',
      color: 'var(--text-muted)',
      maxWidth: '300px',
      zIndex: 9999,
      margin: 'var(--space-2)',
    }}>
      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
          Telegram Debug
        </summary>
        <div style={{ marginTop: 'var(--space-2)' }}>
          <div>Loading: {auth.loading ? 'Yes' : 'No'}</div>
          <div>Valid Telegram: {auth.isValidTelegram ? 'Yes' : 'No'}</div>
          <div>Group Member: {auth.isGroupMember === null ? 'Unknown' : auth.isGroupMember ? 'Yes' : 'No'}</div>
          <div>Group Check Loading: {auth.groupCheckLoading ? 'Yes' : 'No'}</div>
          {auth.error && <div style={{ color: 'var(--error)' }}>Error: {auth.error}</div>}
          {auth.user && (
            <div style={{ marginTop: 'var(--space-1)' }}>
              <div>User ID: {auth.user.id}</div>
              <div>Name: {auth.user.first_name}</div>
              {auth.user.username && <div>Username: @{auth.user.username}</div>}
            </div>
          )}
          <div style={{ marginTop: 'var(--space-1)' }}>
            WebApp Available: {typeof window !== 'undefined' && window.Telegram?.WebApp ? 'Yes' : 'No'}
          </div>
        </div>
      </details>
    </div>
  );
}
