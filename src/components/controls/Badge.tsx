import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { cx } from '../utils';
import './Badge.css';

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
