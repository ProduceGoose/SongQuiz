import { Icon, type IconName } from './Icon';
import { cx, useMaybeControlled } from '../utils';
import './SearchField.css';

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
