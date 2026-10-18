import type { ReactNode } from 'react';
import { Badge } from '../controls/Badge';
import { Icon } from '../controls/Icon';
import { Sleeve, artSize } from './Sleeve';
import { cx } from '../utils';
import './AlbumTile.css';

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
