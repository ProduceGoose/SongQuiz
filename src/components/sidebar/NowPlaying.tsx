import type { ReactNode } from 'react';
import { Icon } from '../controls/Icon';
import { Sleeve } from '../albums/Sleeve';
import { cx } from '../utils';
import './NowPlaying.css';

export interface NowPlayingProps {
  /** Default "Now Playing"; "Last song" after a reveal. */
  label?: string;
  art?: string;
  title?: string;
  subtitle?: string;
  hidden?: boolean;
  /** Shown over the art, e.g. the last seconds of a round. */
  overlay?: ReactNode;
  /** Under the caption, e.g. a "Listen on Apple Music" link. */
  children?: ReactNode;
  className?: string;
}

export function NowPlaying({ label = 'Now Playing', art, title, subtitle, hidden, overlay, children, className }: NowPlayingProps) {
  return (
    <section className={cx('sq-nowplaying', className)} aria-label={label}>
      <div className="sq-nowplaying-head"><Icon name="play" size={8} />{label}</div>
      <div className="sq-nowplaying-art">
        {hidden || !art ? <Sleeve hidden={hidden} /> : <img src={art} alt={title ? 'Cover of ' + title : ''} />}
        {overlay ? <div className="sq-nowplaying-overlay">{overlay}</div> : null}
      </div>
      {title || subtitle || children ? (
        <div className="sq-nowplaying-caption">
          {title ? <div className="sq-nowplaying-title sq-ellipsis">{title}</div> : null}
          {subtitle ? <div className="sq-nowplaying-subtitle sq-ellipsis">{subtitle}</div> : null}
          {children ? <div className="sq-nowplaying-extra">{children}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
