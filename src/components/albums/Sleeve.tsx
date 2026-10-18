import type { CSSProperties } from 'react';
import './Sleeve.css';

/** Placeholder art: a silver sleeve with a record, or a dark sleeve with "?" while hidden. */
export function Sleeve({ hidden }: { hidden?: boolean }) {
  return hidden
    ? <span className="sq-sleeve sq-sleeve-hidden" aria-hidden>?</span>
    : <span className="sq-sleeve" aria-hidden />;
}

/** Inline style that sets the art size (px) for a grid, tile or sleeve. */
export const artSize = (size?: number) => (size ? ({ '--sq-art': size + 'px' } as CSSProperties) : undefined);
