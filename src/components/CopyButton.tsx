import { useState } from 'react';

interface Props {
  text: string;
}

export default function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      onClick={handleClick}
      className="copy-btn"
      title={copied ? 'Copied' : 'Copy'}
      aria-label="copy"
    >
      📋
    </button>
  );
}
