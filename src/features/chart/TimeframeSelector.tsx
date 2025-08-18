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
  '30m': '30M',
  '1h': '1H',
  '2h': '2H',
  '4h': '4H',
  '6h': '6H',
  '12h': '12H',
  '1d': '1D',
};

export default function TimeframeSelector({ selectedTf, availableTfs, onTfChange, disabled = false }: Props) {
  const sortedTfs = useMemo(() => {
    const order: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'];
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
