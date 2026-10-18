import type { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';
import { cx, formatTime, useMaybeControlled } from './utils';

// ---- Transport -------------------------------------------------------------

type TransportIcon = 'play' | 'pause' | 'prev' | 'next';

const TRANSPORT_LABELS: Record<TransportIcon, string> = { play: 'Play', pause: 'Pause', prev: 'Replay snippet', next: 'Skip' };

export interface TransportButtonProps {
  icon?: TransportIcon;
  size?: 'md' | 'lg';
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function TransportButton({ icon = 'play', size = 'md', label, onClick, disabled, className }: TransportButtonProps) {
  return (
    <button
      type="button" disabled={disabled} onClick={onClick}
      className={cx('sq-transport-btn', 'sq-transport-' + size, className)}
      aria-label={label ?? TRANSPORT_LABELS[icon]}
    >
      <Icon name={icon} size={size === 'lg' ? 18 : 13} />
    </button>
  );
}

export interface TransportProps {
  /** Shows pause when true. */
  playing?: boolean;
  onPrevious?: () => void;
  onToggle?: () => void;
  onNext?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Transport({ playing = false, onPrevious, onToggle, onNext, disabled, className }: TransportProps) {
  return (
    <div className={cx('sq-transport', className)} role="group" aria-label="Playback">
      <TransportButton icon="prev" onClick={onPrevious} disabled={disabled} />
      <TransportButton icon={playing ? 'pause' : 'play'} size="lg" onClick={onToggle} disabled={disabled} />
      <TransportButton icon="next" onClick={onNext} disabled={disabled} />
    </div>
  );
}

// ---- VolumeSlider ----------------------------------------------------------

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

// ---- LcdDisplay ------------------------------------------------------------

export interface LcdDisplayProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** 0–1; omit to hide the progress bar. */
  progress?: number;
  /** Seconds (formatted m:ss) or a preformatted string. */
  elapsed?: number | string;
  /** Seconds left (shown as -m:ss) or a preformatted string. */
  remaining?: number | string;
  start?: ReactNode;
  end?: ReactNode;
  progressLabel?: string;
  className?: string;
}

export function LcdDisplay({ title, subtitle, progress, elapsed, remaining, start, end, progressLabel = 'Snippet progress', className }: LcdDisplayProps) {
  const p = progress == null ? null : Math.max(0, Math.min(1, progress));
  const el = typeof elapsed === 'number' ? formatTime(elapsed) : elapsed;
  const rem = typeof remaining === 'number' ? formatTime(-Math.abs(remaining)) : remaining;
  return (
    <div className={cx('sq-lcd', className)}>
      <div className="sq-lcd-side">{start}</div>
      <div className="sq-lcd-body">
        {title != null ? <div className="sq-lcd-title">{title}</div> : null}
        {subtitle != null ? <div className="sq-lcd-subtitle">{subtitle}</div> : null}
        {p != null ? (
          <div className="sq-lcd-progress">
            <span className="sq-lcd-time sq-lcd-elapsed">{el}</span>
            <div className="sq-lcd-track" role="progressbar" aria-label={progressLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}>
              <div className="sq-lcd-fill" style={{ width: p * 100 + '%' }} />
            </div>
            <span className="sq-lcd-time">{rem}</span>
          </div>
        ) : null}
      </div>
      <div className="sq-lcd-side">{end}</div>
    </div>
  );
}
