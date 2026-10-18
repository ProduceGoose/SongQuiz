// Layout pieces shared by the screens. The jukebox components themselves
// (Window, Button, AlbumGrid, …) come from the design system, @songquiz/ui.
import type { ReactNode } from 'react';

function cx(...names: Array<string | false | undefined>) {
  return names.filter(Boolean).join(' ');
}

/** Big prompt at the top of a screen, with optional action buttons as children. */
export function ScreenHeader({ title, hint, align, children }: { title: ReactNode; hint?: ReactNode; align?: 'left'; children?: ReactNode }) {
  return (
    <header className={cx('app-screen-header', align === 'left' && 'is-left')}>
      <h1 className="app-question">{title}</h1>
      {hint ? <p className="app-hint">{hint}</p> : null}
      {children ? <div className="app-actions">{children}</div> : null}
    </header>
  );
}

/** A titled block on the dark content area. */
export function Section({ title, hint, action, children }: { title: ReactNode; hint?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="app-section">
      <div className="app-section-head">
        <div>
          <h2 className="app-section-title">{title}</h2>
          {hint ? <p className="app-hint">{hint}</p> : null}
        </div>
        {action ?? null}
      </div>
      {children}
    </section>
  );
}

/** Silver preference panel, like a settings window, for forms. */
export function Sheet({ title, className, children }: { title?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cx('app-sheet', className)}>
      {title ? <h2 className="app-sheet-title">{title}</h2> : null}
      <div className="app-sheet-body">{children}</div>
    </section>
  );
}

/** LCD-style message box. */
export function Notice({ children }: { children: ReactNode }) {
  return <p className="app-notice" role="status">{children}</p>;
}
