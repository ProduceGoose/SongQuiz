import type { CSSProperties } from 'react';
import { cx } from '../utils';

// 16×16 glyphs. 'f' = filled path, 's' = stroked path (optional stroke width).
type Part = ['f', string] | ['s', string, number?];

const ICONS = {
  play: [['f', 'M5 3.25v9.5L12.75 8z']],
  pause: [['f', 'M4.25 3h2.75v10H4.25zM9 3h2.75v10H9z']],
  prev: [['f', 'M8 4v8L2.25 8zM14 4v8L8.25 8z']],
  next: [['f', 'M2 4v8l5.75-4zM8 4v8l5.75-4z']],
  'volume-low': [['f', 'M2 6h2.5L8 3v10L4.5 10H2z']],
  'volume-high': [['f', 'M1.5 6H4l3.5-3v10L4 10H1.5z'], ['s', 'M10 5.5a3.5 3.5 0 0 1 0 5', 1.4], ['s', 'M12 3.5a6.4 6.4 0 0 1 0 9', 1.4]],
  search: [['s', 'M10.5 6.5a4 4 0 1 1-8 0a4 4 0 1 1 8 0', 1.7], ['s', 'M9.5 9.5l4 4', 2]],
  plus: [['f', 'M7 2.5h2v4.5h4.5v2H9v4.5H7V9H2.5V7H7z']],
  shuffle: [['s', 'M2 4.5h2.2c3.2 0 4.2 7 7.4 7H13', 1.5], ['s', 'M2 11.5h2.2c1.3 0 2.1-1.2 2.8-2.7', 1.5], ['s', 'M9 6.6c.7-1.2 1.4-2.1 2.6-2.1H13', 1.5], ['f', 'M12.5 2.25l3 2.25-3 2.25z'], ['f', 'M12.5 9.25l3 2.25-3 2.25z']],
  repeat: [['s', 'M2.75 9V6.75a2 2 0 0 1 2-2H12', 1.5], ['s', 'M13.25 7v2.25a2 2 0 0 1-2 2H4', 1.5], ['f', 'M11.5 2.25l3 2.5-3 2.5z'], ['f', 'M4.5 8.75l-3 2.5 3 2.5z']],
  music: [['f', 'M6 3.6l7-1.6v8.4a2.1 2.1 0 1 1-1.5-2V4.7L7.5 5.7v6.2a2.1 2.1 0 1 1-1.5-2z']],
  playlist: [['f', 'M1.5 3h9v1.6h-9zM1.5 6.4h9V8h-9zM1.5 9.8h5.5v1.6H1.5z'], ['f', 'M11.5 6.2L15 5.4v1.7l-2 .45v4.6a1.75 1.75 0 1 1-1.5-1.73z']],
  user: [['f', 'M10.75 5.25a2.75 2.75 0 1 1-5.5 0a2.75 2.75 0 1 1 5.5 0'], ['f', 'M2.5 14c0-3 2.4-5 5.5-5s5.5 2 5.5 5z']],
  users: [['f', 'M8.25 5a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 1 1 4.5 0'], ['f', 'M1 13.5c0-2.6 2-4.3 5-4.3s5 1.7 5 4.3z'], ['f', 'M13.5 5.5a2 2 0 1 1-4 0a2 2 0 1 1 4 0'], ['f', 'M12 13.5h3.5c0-2.3-1.5-3.8-3.9-3.9c.9.9 1.4 2.2 1.6 3.9z']],
  trophy: [['f', 'M4.5 2h7v3.5a3.5 3.5 0 0 1-7 0z'], ['s', 'M4.5 3.25H2.5v1a2.25 2.25 0 0 0 2.25 2.25', 1.3], ['s', 'M11.5 3.25h2v1a2.25 2.25 0 0 1-2.25 2.25', 1.3], ['f', 'M7.25 9h1.5v2.5H11V14H5v-2.5h2.25z']],
  check: [['s', 'M3 8.5l3.2 3L13 4.5', 2.2]],
  cross: [['s', 'M4 4l8 8M12 4l-8 8', 2.2]],
  clock: [['s', 'M14 8a6 6 0 1 1-12 0a6 6 0 1 1 12 0', 1.5], ['s', 'M8 4.5V8l2.5 1.5', 1.5]],
  list: [['f', 'M2 3h12v2.25H2zM2 6.9h12v2.25H2zM2 10.75h12V13H2z']],
  grid: [['f', 'M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z']],
  disclosure: [['f', 'M5 3.5l6 4.5-6 4.5z']],
  'disclosure-down': [['f', 'M3.5 5h9L8 11z']],
  broadcast: [['f', 'M9.5 8a1.5 1.5 0 1 1-3 0a1.5 1.5 0 1 1 3 0'], ['s', 'M5.2 5.2a4 4 0 0 0 0 5.6M10.8 5.2a4 4 0 0 1 0 5.6', 1.4], ['s', 'M3.1 3.1a7 7 0 0 0 0 9.8M12.9 3.1a7 7 0 0 1 0 9.8', 1.4]]
} satisfies Record<string, Part[]>;

export type IconName = keyof typeof ICONS;

/** Every glyph name, in display order. */
export const iconNames = Object.keys(ICONS) as IconName[];

export interface IconProps {
  name: IconName;
  /** Pixels. Default 16. */
  size?: number;
  /** Only when the glyph stands alone and needs a name; otherwise it is hidden from screen readers. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 16, title, className, style }: IconProps) {
  const parts: Part[] = ICONS[name] ?? [];
  return (
    <svg
      viewBox="0 0 16 16" width={size} height={size} focusable="false"
      className={cx('sq-icon', className)} style={style}
      role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {parts.map((p, i) => p[0] === 'f'
        ? <path key={i} d={p[1]} fill="currentColor" />
        : <path key={i} d={p[1]} fill="none" stroke="currentColor" strokeWidth={p[2] ?? 1.6} strokeLinecap="round" strokeLinejoin="round" />)}
    </svg>
  );
}
