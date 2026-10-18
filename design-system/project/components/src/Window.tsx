import type { CSSProperties, ReactNode } from 'react';
import { cx } from './utils';

export interface WindowProps {
  /** The room name, e.g. "SongQuiz — Friday Night Room". */
  title?: ReactNode;
  /** Usually a Toolbar. */
  toolbar?: ReactNode;
  /** A SourceList, optionally followed by NowPlaying. */
  sidebar?: ReactNode;
  /** A StatusBar. */
  statusBar?: ReactNode;
  children?: ReactNode;
  /** Makes the close dot leave the room. */
  onClose?: () => void;
  /** Accessible name of the close dot. Default "Leave room". */
  closeLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export function Window({ title, toolbar, sidebar, statusBar, children, onClose, closeLabel = 'Leave room', className, style }: WindowProps) {
  return (
    <div className={cx('sq-window', className)} style={style}>
      <div className="sq-window-head">
        <div className="sq-titlebar">
          <span className="sq-dots">
            <button type="button" className="sq-dot sq-dot-close" aria-label={closeLabel} onClick={onClose} />
            <i className="sq-dot sq-dot-minimize" aria-hidden />
            <i className="sq-dot sq-dot-zoom" aria-hidden />
          </span>
          <div className="sq-title">{title}</div>
        </div>
        {toolbar ? <div className="sq-window-toolbar">{toolbar}</div> : null}
      </div>
      <div className="sq-window-main">
        {sidebar ? <aside className="sq-window-sidebar">{sidebar}</aside> : null}
        <div className="sq-window-content">{children}</div>
      </div>
      {statusBar ?? null}
    </div>
  );
}

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
