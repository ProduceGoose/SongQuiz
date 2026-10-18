import type { MouseEvent, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { cx } from '../utils';
import './Button.css';

export interface ButtonProps {
  children?: ReactNode;
  variant?: 'default' | 'primary';
  size?: 'md' | 'lg';
  icon?: IconName | null;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  title?: string;
  className?: string;
}

export function Button({ children, variant = 'default', size = 'md', icon, onClick, disabled, type = 'button', title, className }: ButtonProps) {
  return (
    <button
      type={type} disabled={disabled} onClick={onClick} title={title}
      className={cx('sq-btn', 'sq-btn-' + variant, 'sq-btn-' + size, className)}
    >
      {icon ? <Icon name={icon} size={size === 'lg' ? 14 : 12} /> : null}
      {children != null ? <span>{children}</span> : null}
    </button>
  );
}
