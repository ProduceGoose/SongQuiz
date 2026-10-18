import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Icon, type IconName } from '../controls/Icon';
import { cx } from '../utils';
import { ChatMessage, type ChatEntry } from './ChatMessage';
// The message field and send button reuse the search field and bar button looks.
import '../controls/SearchField.css';
import '../statusbar/StatusBar.css';
import './ChatPanel.css';

export interface ChatPanelProps {
  entries: ChatEntry[];
  /** Called with the trimmed text when you press Enter or Send. */
  onSend?: (text: string) => void;
  /** The header label. Default "Chat". */
  title?: string;
  placeholder?: string;
  /** Glyph in the message field; "music" while a round is on and messages count as guesses. */
  icon?: IconName;
  disabled?: boolean;
  className?: string;
}

/** Re-renders every `ms` so "12 seconds ago" stays current. */
function useNow(ms: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

export function ChatPanel({ entries, onSend, title = 'Chat', placeholder = 'Message', icon = 'chat', disabled, className }: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLOListElement>(null);
  const pinned = useRef(true);
  const now = useNow(5000);

  // Stay at the newest message unless you scrolled up to read.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list && pinned.current) list.scrollTop = list.scrollHeight;
  }, [entries[entries.length - 1]?.id]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || disabled) return;
    onSend?.(text);
    setDraft('');
    pinned.current = true;
  }

  return (
    <section className={cx('sq-chat', className)} aria-label={title}>
      <header className="sq-chat-head">
        <span className="sq-chat-crumb">{title}</span>
      </header>
      <ol
        ref={listRef} className="sq-chat-list" aria-live="polite" aria-relevant="additions"
        onScroll={(e) => {
          const el = e.currentTarget;
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
      >
        {entries.map((entry) => <ChatMessage key={entry.id} entry={entry} now={now} />)}
      </ol>
      <form className="sq-chat-compose" onSubmit={submit}>
        <label className="sq-search sq-chat-field">
          <Icon name={icon} size={12} />
          <input
            type="text" value={draft} placeholder={placeholder} aria-label={placeholder} maxLength={200}
            autoComplete="off" spellCheck={false} disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <button type="submit" className="sq-barbtn sq-chat-send" aria-label="Send" title="Send" disabled={disabled || !draft.trim()}>
          <Icon name="disclosure" size={10} />
        </button>
      </form>
    </section>
  );
}
