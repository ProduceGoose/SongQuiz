import type { CSSProperties } from 'react';
import { Icon } from '../controls/Icon';
import { cx, useMaybeControlled } from '../utils';
import './VolumeSlider.css';

export interface VolumeSliderProps {
  value?: number;
  /** Default 70. */
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function VolumeSlider({ value, defaultValue = 70, onChange, min = 0, max = 100, label = 'Volume', disabled, className }: VolumeSliderProps) {
  const [current, setCurrent] = useMaybeControlled(value, defaultValue, onChange);
  const pct = ((current - min) / (max - min)) * 100;
  return (
    <div className={cx('sq-volume', className)}>
      <Icon name="volume-low" size={12} />
      <input
        type="range" min={min} max={max} value={current} className="sq-volume-range"
        aria-label={label} disabled={disabled}
        style={{ '--sq-fill': pct + '%' } as CSSProperties}
        onChange={(e) => setCurrent(Number(e.target.value))}
      />
      <Icon name="volume-high" size={12} />
    </div>
  );
}
