import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { cx } from '../utils';
import './Window.css';

export interface WindowProps {
  /** The room name, e.g. "iQuiz — Friday Night Room". */
  title?: ReactNode;
  /** Usually a Toolbar. */
  toolbar?: ReactNode;
  /** A SourceList, optionally followed by NowPlaying. */
  sidebar?: ReactNode;
  /** Right-hand panel, usually a ChatPanel. */
  panel?: ReactNode;
  /** The panel's width in px; default the --panel-w token. */
  panelWidth?: number;
  /** Makes the panel resizable by dragging its left edge (or the arrow keys on it). */
  onPanelResize?: (width: number) => void;
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

const PANEL_MIN = 220;
const PANEL_MAX = 560;
const PANEL_STEP = 16;

/** The grip on the panel's left edge: drag it, or focus it and use the arrow keys. */
function PanelGrip({ width, onResize }: { width: number; onResize: (width: number) => void }) {
  const drag = useRef<{ x: number; width: number } | null>(null);
  const clamp = (w: number) => Math.round(Math.min(PANEL_MAX, Math.max(PANEL_MIN, w)));

  function down(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    const panel = e.currentTarget.parentElement!;
    drag.current = { x: e.clientX, width: panel.getBoundingClientRect().width };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    if (drag.current) onResize(clamp(drag.current.width + drag.current.x - e.clientX));
  }

  function key(e: KeyboardEvent<HTMLDivElement>) {
    const by = e.key === 'ArrowLeft' ? PANEL_STEP : e.key === 'ArrowRight' ? -PANEL_STEP : 0;
    if (!by) return;
    e.preventDefault();
    onResize(clamp(width + by));
  }

  return (
    <div
      className="sq-window-grip" role="separator" aria-orientation="vertical" aria-label="Resize the chat"
      aria-valuenow={width} aria-valuemin={PANEL_MIN} aria-valuemax={PANEL_MAX} tabIndex={0}
      onPointerDown={down} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}
      onKeyDown={key}
    />
  );
}

export function Window({ title, toolbar, sidebar, panel, panelWidth, onPanelResize, statusBar, children, onClose, closeLabel = 'Leave room', className, style }: WindowProps) {
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
        {panel ? (
          <aside className="sq-window-panel" style={panelWidth ? { width: panelWidth } : undefined}>
            {onPanelResize ? <PanelGrip width={panelWidth ?? 264} onResize={onPanelResize} /> : null}
            {panel}
          </aside>
        ) : null}
      </div>
      {statusBar ?? null}
    </div>
  );
}
