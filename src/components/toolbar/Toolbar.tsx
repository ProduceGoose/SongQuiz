import type { ReactNode } from 'react';
import { cx } from '../utils';
import './Toolbar.css';

export interface ToolbarProps {
  start?: ReactNode;
  /** Stretches to at most 460px; usually an LcdDisplay. */
  center?: ReactNode;
  end?: ReactNode;
  className?: string;
}

export function Toolbar({ start, center, end, className }: ToolbarProps) {
  return (
    <div className={cx('sq-toolbar', className)}>
      <div className="sq-toolbar-start">{start}</div>
      <div className="sq-toolbar-center">{center}</div>
      <div className="sq-toolbar-end">{end}</div>
    </div>
  );
}
