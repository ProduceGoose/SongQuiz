import type { MouseEvent, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { cx, useMaybeControlled } from './utils';

// ---- SegmentedControl ------------------------------------------------------

export interface SegmentOption {
  value: string;
  label?: string;
  icon?: IconName;
  /** Required for an icon-only option. */
  title?: string;
}

export interface SegmentedControlProps {
  options: Array<string | SegmentOption>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Accessible name of the radio group. */
  label?: string;
  className?: string;
}

export function SegmentedControl({ options, value, defaultValue, onChange, label, className }: SegmentedControlProps) {
  const opts: SegmentOption[] = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const [current, setCurrent] = useMaybeControlled(value, defaultValue ?? opts[0]?.value ?? '', onChange);
  return (
    <div className={cx('sq-segmented', className)} role="radiogroup" aria-label={label}>
      {opts.map((o) => {
        const on = o.value === current;
        const name = o.label ? undefined : o.title ?? o.value;
        return (
          <button
            key={o.value} type="button" role="radio" aria-checked={on} aria-label={name} title={name}
            className={cx('sq-seg', on && 'is-on', !o.label && 'sq-seg-icon')}
            onClick={() => setCurrent(o.value)}
          >
            {o.icon ? <Icon name={o.icon} size={12} /> : null}
            {o.label ? <span>{o.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

// ---- SearchField -----------------------------------------------------------

export interface SearchFieldProps {
  value?: string;
  defaultValue?: string;
  onChange?: (text: string) => void;
  /** Called on Enter. */
  onSubmit?: (text: string) => void;
  placeholder?: string;
  size?: 'md' | 'lg';
  /** Default "search"; use "music" for answers. */
  icon?: IconName;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function SearchField({
  value, defaultValue = '', onChange, onSubmit, placeholder = 'Search', size = 'md', icon = 'search',
  label, disabled, autoFocus, className
}: SearchFieldProps) {
  const [current, setCurrent] = useMaybeControlled(value, defaultValue, onChange);
  return (
    <form
      className={cx('sq-search', 'sq-search-' + size, className)} role="search"
      onSubmit={(e) => { e.preventDefault(); onSubmit?.(current); }}
    >
      <Icon name={icon} size={size === 'lg' ? 16 : 12} />
      <input
        type="text" value={current} placeholder={placeholder} aria-label={label ?? placeholder}
        autoComplete="off" spellCheck={false} disabled={disabled} autoFocus={autoFocus}
        onChange={(e) => setCurrent(e.target.value)}
      />
      {current && !disabled ? (
        <button type="button" className="sq-search-clear" aria-label="Clear" onClick={() => setCurrent('')}>
          <Icon name="cross" size={8} />
        </button>
      ) : null}
    </form>
  );
}

// ---- Button ----------------------------------------------------------------

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
