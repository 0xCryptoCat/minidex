import { useState } from 'react';
import { ContentCopy as CopyIcon, Check as CheckIcon } from '@mui/icons-material';
import '../styles/tooltips.css';

interface Props {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label }: Props) {
  const [copied, setCopied] = useState(false);
  
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      copy();
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      onKeyDown={handleKey}
      className="copy-btn"
      aria-label={label ? `Copy ${label}` : 'Copy'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 'var(--space-1)',
        borderRadius: 'var(--radius-small)',
        color: copied ? 'var(--success)' : 'var(--text-muted)',
        transition: 'all var(--transition-fast)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <CopyIcon sx={{ fontSize: 16 }} />}
      {copied && <span className="tooltip">Copied</span>}
    </button>
  );
}
