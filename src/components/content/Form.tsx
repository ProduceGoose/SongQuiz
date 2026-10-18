import type { ReactNode } from 'react';
import { Icon, type IconName } from '../controls/Icon';
import '../controls/SearchField.css';
import './content.css';

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: IconName;
  placeholder?: string;
  maxLength?: number;
  /** Shown in place of `help`, with the field marked invalid. */
  error?: string | null;
  help?: string;
  /** Uppercase, spaced-out letters for room codes. */
  mono?: boolean;
}

/** Labelled pill text field in the style of the design system's SearchField. */
export function Field({ id, label, value, onChange, icon, placeholder, maxLength, error, help, mono }: FieldProps) {
  const errorId = id + '-error';
  const helpId = id + '-help';
  return (
    <div className={error ? 'app-field is-invalid' : 'app-field'}>
      <label className="app-label" htmlFor={id}>{label}</label>
      <div className="sq-search sq-search-lg">
        {icon ? <Icon name={icon} size={16} /> : null}
        <input
          id={id} type="text" value={value} placeholder={placeholder} maxLength={maxLength}
          autoComplete="off" spellCheck={false} className={mono ? 'app-input-code' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : help ? helpId : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {error ? (
        <p className="app-error" id={errorId}><Icon name="cross" size={9} />{error}</p>
      ) : help ? (
        <p className="app-help" id={helpId}>{help}</p>
      ) : null}
    </div>
  );
}

/** One row of a Sheet: a label (and hint) on the left, a control on the right. */
export function Setting({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="app-setting">
      <div className="app-setting-text">
        <span className="app-label">{label}</span>
        {hint ? <span className="app-help">{hint}</span> : null}
      </div>
      <div className="app-setting-control">{children}</div>
    </div>
  );
}
