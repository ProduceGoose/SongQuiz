import { Icon, type IconName } from './Icon';
import { cx, useMaybeControlled } from '../utils';
import './SegmentedControl.css';

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
