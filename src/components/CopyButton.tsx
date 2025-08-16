import { useState } from 'react';
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
    >
      📋
      {copied && <span className="tooltip">Copied</span>}
    </button>
  );
}
