import { Badge, type BadgeTone } from '../controls/Badge';
import { cx } from '../utils';
import './List.css';

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
