import type { ReactNode } from 'react';
import { cx, formatTime } from '../utils';
import './LcdDisplay.css';

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
