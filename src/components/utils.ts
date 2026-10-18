import { useState } from 'react';

/** Joins the truthy class names with spaces. */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

/** Controlled when `value` is given, otherwise keeps its own state. */
export function useMaybeControlled<T>(value: T | undefined | null, initial: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [inner, setInner] = useState<T>(initial);
  const controlled = value !== undefined && value !== null;
  const current = controlled ? (value as T) : inner;
  const set = (next: T) => {
    if (!controlled) setInner(next);
    onChange?.(next);
  };
  return [current, set];
}

/** "just now", "12 seconds ago", "3 minutes ago", "2 hours ago". */
export function timeAgo(time: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - time) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return s + ' seconds ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m === 1 ? '1 minute ago' : m + ' minutes ago';
  const h = Math.floor(m / 60);
  return h === 1 ? '1 hour ago' : h + ' hours ago';
}

/** Seconds as m:ss; negative numbers get a leading minus ("-0:18"). */
export function formatTime(seconds: number): string {
  const negative = seconds < 0;
  const total = Math.abs(Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return (negative ? '-' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}
