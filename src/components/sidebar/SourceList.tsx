import { useState, type ReactNode } from 'react';
import { Icon, type IconName } from '../controls/Icon';
import { cx } from '../utils';
import './SourceList.css';

export interface SourceItem {
  id: string;
  label: ReactNode;
  icon?: IconName;
  /** Short number shown in a count pill: player count or score. */
  badge?: ReactNode;
}

export interface SourceSection {
  /** Written in any case, shown uppercase. */
  title?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  items: SourceItem[];
}

export interface SourceListProps {
  sections: SourceSection[];
  selected?: string;
  onSelect?: (id: string) => void;
  /** Accessible name of the nav landmark. Default "Sidebar". */
  label?: string;
  className?: string;
}

export function SourceList({ sections, selected, onSelect, label = 'Sidebar', className }: SourceListProps) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  return (
    <nav className={cx('sq-source', className)} aria-label={label}>
      {sections.map((section, i) => {
        const key = section.title ?? String(i);
        const isClosed = closed[key] ?? !!section.collapsed;
        const toggle = () => setClosed({ ...closed, [key]: !isClosed });

        let heading: ReactNode = null;
        if (section.title != null) {
          heading = section.collapsible ? (
            <button type="button" className="sq-source-heading" aria-expanded={!isClosed} onClick={toggle}>
              <Icon name={isClosed ? 'disclosure' : 'disclosure-down'} size={8} />
              {section.title}
            </button>
          ) : (
            <div className="sq-source-heading">{section.title}</div>
          );
        }

        return (
          <div key={key} className="sq-source-section">
            {heading}
            {isClosed ? null : (
              <ul className="sq-source-items">
                {section.items.map((item) => {
                  const on = item.id === selected;
                  return (
                    <li key={item.id}>
                      <button
                        type="button" className={cx('sq-source-item', on && 'is-on')} aria-current={on ? 'true' : undefined}
                        onClick={() => onSelect?.(item.id)}
                      >
                        {item.icon ? <Icon name={item.icon} size={16} /> : null}
                        <span className="sq-source-label">{item.label}</span>
                        {item.badge != null ? <span className="sq-count">{item.badge}</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
