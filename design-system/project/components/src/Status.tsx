import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { cx } from './utils';

// ---- Badge -----------------------------------------------------------------

export type BadgeTone = 'neutral' | 'aqua' | 'correct' | 'wrong' | 'gold';

const BADGE_ICON: Partial<Record<BadgeTone, IconName>> = { correct: 'check', wrong: 'cross', gold: 'trophy' };

export interface BadgeProps {
  children?: ReactNode;
  tone?: BadgeTone;
  /** Defaults to check, cross or trophy for those tones; null for none. */
  icon?: IconName | null;
  className?: string;
}

export function Badge({ children, tone = 'neutral', icon, className }: BadgeProps) {
  const glyph = icon === undefined ? BADGE_ICON[tone] : icon;
  return (
    <span className={cx('sq-badge', 'sq-badge-' + tone, className)}>
      {glyph ? <Icon name={glyph} size={9} /> : null}
      {children}
    </span>
  );
}

// ---- Leaderboard -----------------------------------------------------------

export type PlayerStatus = 'guessing' | 'locked' | 'correct' | 'wrong' | 'away';

const PLAYER_STATUS: Record<PlayerStatus, [BadgeTone, string]> = {
  guessing: ['neutral', 'Guessing'],
  locked: ['aqua', 'Locked in'],
  correct: ['correct', 'Correct'],
  wrong: ['wrong', 'Wrong'],
  away: ['neutral', 'Away']
};

export interface LeaderboardPlayer {
  id: string;
  name: string;
  score: number;
  /** Points from the last round. */
  delta?: number;
  streak?: number;
  status?: PlayerStatus;
  /** Muted suffix like "(you)" or "(host)". */
  note?: string;
}

export interface LeaderboardProps {
  players: LeaderboardPlayer[];
  /** Your player id; that row is highlighted. */
  highlight?: string;
  /** Screen-reader title. */
  caption?: string;
  /** false keeps your order; default sorts by score, high first. */
  sort?: boolean;
  /** For number formatting. Default "en-US". */
  locale?: string;
  className?: string;
}

export function Leaderboard({ players, highlight, caption, sort = true, locale = 'en-US', className }: LeaderboardProps) {
  const rows = players.slice();
  if (sort) rows.sort((a, b) => (b.score || 0) - (a.score || 0));
  const nf = new Intl.NumberFormat(locale);
  return (
    <table className={cx('sq-list', className)}>
      {caption ? <caption className="sq-visually-hidden">{caption}</caption> : null}
      <thead>
        <tr>
          <th scope="col" className="sq-col-rank">#</th>
          <th scope="col">Player</th>
          <th scope="col" className="sq-col-status">Status</th>
          <th scope="col" className="sq-col-num">Streak</th>
          <th scope="col" className="sq-col-num is-sorted" aria-sort={sort ? 'descending' : undefined}>Score</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p, i) => {
          const status = p.status ? PLAYER_STATUS[p.status] : null;
          return (
            <tr key={p.id} className={p.id === highlight ? 'is-on' : undefined}>
              <td className="sq-col-rank">{i === 0 && p.score > 0 ? <Badge tone="gold">1</Badge> : i + 1}</td>
              <td className="sq-col-name">{p.name}{p.note ? <span className="sq-list-note">{' ' + p.note}</span> : null}</td>
              <td className="sq-col-status">{status ? <Badge tone={status[0]}>{status[1]}</Badge> : null}</td>
              <td className="sq-col-num">{p.streak ? p.streak + '×' : '–'}</td>
              <td className="sq-col-num">
                {p.delta ? <span className="sq-delta">{'+' + nf.format(p.delta)}</span> : null}
                {nf.format(p.score || 0)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ---- StatusBar -------------------------------------------------------------

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
