import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../controls/Icon';
import { cx, timeAgo } from '../utils';

export interface ChatEntry {
  id: string;
  /** message: a speech bubble. guess: a bubble marked as a wrong guess. event: a centred line, like "Round 2 of 10". */
  kind: 'message' | 'guess' | 'event';
  /** Player name; not used for events. */
  author?: string;
  /** Avatar image URL; default is the author's initials on a colour picked from the name. */
  avatar?: string;
  text: ReactNode;
  /** When it was sent, in ms (Date.now()). */
  time: number;
  /** Your own messages get a blue edge. */
  mine?: boolean;
  /** Events only: correct is green with a check, reveal is LCD-style. */
  tone?: 'neutral' | 'correct' | 'reveal';
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
}

/** A stable hue for a name, so each player keeps their colour. */
function hue(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export function Avatar({ name, src }: { name: string; src?: string }) {
  return src
    ? <img className="sq-avatar" src={src} alt="" />
    : <span className="sq-avatar" style={{ '--sq-hue': hue(name) } as CSSProperties} aria-hidden>{initials(name)}</span>;
}

export function ChatMessage({ entry, now }: { entry: ChatEntry; now: number }) {
  if (entry.kind === 'event') {
    const tone = entry.tone ?? 'neutral';
    return (
      <li className={cx('sq-chat-event', 'is-' + tone)}>
        {tone === 'correct' ? <Icon name="check" size={9} /> : null}
        <span>{entry.text}</span>
      </li>
    );
  }
  const author = entry.author ?? '';
  return (
    <li className={cx('sq-chat-msg', entry.mine && 'is-mine', entry.kind === 'guess' && 'is-guess')}>
      <Avatar name={author} src={entry.avatar} />
      <div className="sq-chat-bubble">
        <div className="sq-chat-meta">
          <span className="sq-chat-author sq-ellipsis">{author}</span>
          {entry.kind === 'guess' ? <span className="sq-chat-tag">guess</span> : null}
          <time className="sq-chat-time" dateTime={new Date(entry.time).toISOString()}>{timeAgo(entry.time, now)}</time>
        </div>
        <div className="sq-chat-text">{entry.text}</div>
      </div>
    </li>
  );
}
