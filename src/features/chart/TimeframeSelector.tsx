import { useMemo } from 'react';
import type { Timeframe } from '../../lib/types';

interface Props {
  selectedTf: Timeframe;
  availableTfs: Timeframe[];
  onTfChange: (tf: Timeframe) => void;
  disabled?: boolean;
}

const timeframeLabels: Record<Timeframe, string> = {
  '1m': '1M',
  '5m': '5M', 
  '15m': '15M',
  '1h': '1H',
  '4h': '4H',
  '1d': '1D',
};

export default function TimeframeSelector({ selectedTf, availableTfs, onTfChange, disabled = false }: Props) {
  const sortedTfs = useMemo(() => {
    const order: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
    return order.filter(tf => availableTfs.includes(tf));
  }, [availableTfs]);

  if (sortedTfs.length <= 1) {
    return null; // Don't show selector if only one option
  }

  return (
    <div className="timeframe-selector">
      {sortedTfs.map((tf) => (
        <button
          key={tf}
          className={`timeframe-button ${tf === selectedTf ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && onTfChange(tf)}
          disabled={disabled}
          type="button"
        >
          {timeframeLabels[tf]}
        </button>
      ))}
    </div>
  );
}
