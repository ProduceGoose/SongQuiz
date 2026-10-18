import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import './List.css';
import './Table.css';

export interface Column {
  label: string;
  className?: string;
}

/** A design-system list table in a scroll container, so it never widens the page. */
export function Table({ columns, caption, children }: { columns: Column[]; caption?: string; children: ReactNode }) {
  return (
    <div className="app-table">
      <table className="sq-list">
        {caption ? <caption className="sq-visually-hidden">{caption}</caption> : null}
        <thead>
          <tr>{columns.map((c) => <th key={c.label} scope="col" className={c.className}>{c.label}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** Props that make a table row open something on click, Enter or Space. */
export function rowLink(onOpen: () => void, selected?: boolean): HTMLAttributes<HTMLTableRowElement> {
  return {
    className: selected ? 'app-row-link is-on' : 'app-row-link',
    tabIndex: 0,
    onClick: onOpen,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen();
      }
    }
  };
}
