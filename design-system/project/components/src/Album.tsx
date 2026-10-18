import { Children, type CSSProperties, type ReactNode } from 'react';
import { Badge } from './Status';
import { Icon } from './Icon';
import { cx } from './utils';

/** Placeholder art: a silver sleeve with a record, or a dark sleeve with "?" while hidden. */
function Sleeve({ hidden }: { hidden?: boolean }) {
  return hidden
    ? <span className="sq-sleeve sq-sleeve-hidden" aria-hidden>?</span>
    : <span className="sq-sleeve" aria-hidden />;
}

const artSize = (size?: number) => (size ? ({ '--sq-art': size + 'px' } as CSSProperties) : undefined);

// ---- AlbumGrid -------------------------------------------------------------

export interface AlbumGridProps {
  children?: ReactNode;
  /** Accessible name of the list, e.g. "Answer choices". */
  label?: string;
  /** Art size in px. Default art-md (96px). */
  size?: number;
  className?: string;
}

export function AlbumGrid({ children, label, size, className }: AlbumGridProps) {
  return (
    <div className={cx('sq-grid', className)} role="list" aria-label={label} style={artSize(size)}>
      {Children.map(children, (child) => (child ? <div role="listitem" className="sq-grid-cell">{child}</div> : null))}
    </div>
  );
}

// ---- AlbumTile -------------------------------------------------------------

export type AlbumTileState = 'idle' | 'selected' | 'correct' | 'wrong' | 'hidden' | 'dimmed';

const STATE_BADGE: Partial<Record<AlbumTileState, ['correct' | 'wrong', string]>> = {
  correct: ['correct', 'Correct'],
  wrong: ['wrong', 'Wrong']
};

export interface AlbumTileProps {
  /** Image URL; omit for the placeholder sleeve. */
  art?: string;
  title?: ReactNode;
  /** The artist. */
  subtitle?: ReactNode;
  state?: AlbumTileState;
  /** Adds a speaker glyph before the title. */
  playing?: boolean;
  /** Makes the tile a button. */
  onClick?: () => void;
  disabled?: boolean;
  /** Art size in px. */
  size?: number;
  /** Overrides "Correct" / "Wrong". */
  badgeLabel?: string;
  className?: string;
}

export function AlbumTile({ art, title, subtitle, state = 'idle', playing, onClick, disabled, size, badgeLabel, className }: AlbumTileProps) {
  const hidden = state === 'hidden';
  const badge = STATE_BADGE[state];
  const content = (
    <>
      <span className="sq-tile-art">
        {hidden || !art ? <Sleeve hidden={hidden} /> : <img src={art} alt="" loading="lazy" />}
        {badge ? <span className="sq-tile-badge"><Badge tone={badge[0]}>{badgeLabel ?? badge[1]}</Badge></span> : null}
      </span>
      <span className="sq-tile-title">
        {playing ? <Icon name="volume-high" size={10} title="Playing" /> : null}
        <span className="sq-ellipsis">{title}</span>
      </span>
      {subtitle != null ? <span className="sq-tile-subtitle sq-ellipsis">{subtitle}</span> : null}
    </>
  );
  const classes = cx('sq-tile', 'is-' + state, className);

  return onClick ? (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={state === 'selected'} className={classes} style={artSize(size)}>
      {content}
    </button>
  ) : (
    <div className={classes} style={artSize(size)}>{content}</div>
  );
}

// ---- NowPlaying ------------------------------------------------------------

export interface NowPlayingProps {
  /** Default "Now Playing"; "Last song" after a reveal. */
  label?: string;
  art?: string;
  title?: string;
  subtitle?: string;
  hidden?: boolean;
  className?: string;
}

export function NowPlaying({ label = 'Now Playing', art, title, subtitle, hidden, className }: NowPlayingProps) {
  return (
    <section className={cx('sq-nowplaying', className)} aria-label={label}>
      <div className="sq-nowplaying-head"><Icon name="play" size={8} />{label}</div>
      <div className="sq-nowplaying-art">
        {hidden || !art ? <Sleeve hidden={hidden} /> : <img src={art} alt={title ? 'Cover of ' + title : ''} />}
      </div>
      {title || subtitle ? (
        <div className="sq-nowplaying-caption">
          {title ? <div className="sq-nowplaying-title sq-ellipsis">{title}</div> : null}
          {subtitle ? <div className="sq-nowplaying-subtitle sq-ellipsis">{subtitle}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
