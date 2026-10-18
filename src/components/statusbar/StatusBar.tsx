import type { ReactNode } from 'react';
import { Icon, type IconName } from '../controls/Icon';
import { cx } from '../utils';
import './StatusBar.css';

export interface BarButtonProps {
  icon: IconName;
  /** Accessible name and tooltip. */
  label: string;
  /** For toggles such as repeat and shuffle. */
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function BarButton({ icon, label, active, onClick, disabled, className }: BarButtonProps) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
      aria-pressed={active == null ? undefined : !!active}
      className={cx('sq-barbtn', active && 'is-on', className)}
    >
      <Icon name={icon} size={12} />
    </button>
  );
}

export interface StatusBarProps {
  /** The one-line room summary. */
  children?: ReactNode;
  start?: ReactNode;
  end?: ReactNode;
  className?: string;
}

export function StatusBar({ children, start, end, className }: StatusBarProps) {
  return (
    <div className={cx('sq-statusbar', className)}>
      <div className="sq-statusbar-start">{start}</div>
      <div className="sq-statusbar-text" aria-live="polite">{children}</div>
      <div className="sq-statusbar-end">{end}</div>
    </div>
  );
}
