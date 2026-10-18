import { Icon } from '../controls/Icon';
import { cx } from '../utils';
import './Transport.css';

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

/** A button whose handler is missing is disabled. */
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
      <TransportButton icon="prev" onClick={onPrevious} disabled={disabled || !onPrevious} />
      <TransportButton icon={playing ? 'pause' : 'play'} size="lg" onClick={onToggle} disabled={disabled || !onToggle} />
      <TransportButton icon="next" onClick={onNext} disabled={disabled || !onNext} />
    </div>
  );
}
