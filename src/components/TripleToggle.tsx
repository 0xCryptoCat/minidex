import { useState } from 'react';
import './TripleToggle.css';

type ToggleOption = 'trades' | 'holders' | 'metrics';

interface Props {
  selected: ToggleOption;
  onChange: (option: ToggleOption) => void;
  className?: string;
}

export default function TripleToggle({ selected, onChange, className = '' }: Props) {
  return (
    <div className={`triple-toggle ${className}`}>
      <div className="toggle-track">
        <div 
          className="toggle-slider"
          style={{
            transform: `translateX(${
              selected === 'trades' ? '0%' : 
              selected === 'holders' ? '100%' : 
              '200%'
            })`
          }}
        />
        <button
          className={`toggle-option ${selected === 'trades' ? 'active' : ''}`}
          onClick={() => onChange('trades')}
        >
          Trades
        </button>
        <button
          className={`toggle-option ${selected === 'holders' ? 'active' : ''}`}
          onClick={() => onChange('holders')}
        >
          Holders
        </button>
        <button
          className={`toggle-option ${selected === 'metrics' ? 'active' : ''}`}
          onClick={() => onChange('metrics')}
        >
          Metrics
        </button>
      </div>
    </div>
  );
}
