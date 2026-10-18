import { Children, type ReactNode } from 'react';
import { artSize } from './Sleeve';
import { cx } from '../utils';
import './AlbumGrid.css';

export interface AlbumGridProps {
  children?: ReactNode;
  /** Accessible name of the list, e.g. "Answer choices". */
  label?: string;
  /** Art size in px. Default art-md (96px). */
  size?: number;
  className?: string;
}

export function AlbumGrid({ children, label, size, className }: AlbumGridProps) {
  return (
    <div className={cx('sq-grid', className)} role="list" aria-label={label} style={artSize(size)}>
      {Children.map(children, (child) => (child ? <div role="listitem" className="sq-grid-cell">{child}</div> : null))}
    </div>
  );
}
