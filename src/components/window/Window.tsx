import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../utils';
import './Window.css';

export interface WindowProps {
  /** The room name, e.g. "SongQuiz — Friday Night Room". */
  title?: ReactNode;
  /** Usually a Toolbar. */
  toolbar?: ReactNode;
  /** A SourceList, optionally followed by NowPlaying. */
  sidebar?: ReactNode;
  /** Right-hand panel, usually a ChatPanel. */
  panel?: ReactNode;
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

export function Window({ title, toolbar, sidebar, panel, statusBar, children, onClose, closeLabel = 'Leave room', className, style }: WindowProps) {
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
        {panel ? <aside className="sq-window-panel">{panel}</aside> : null}
      </div>
      {statusBar ?? null}
    </div>
  );
}
