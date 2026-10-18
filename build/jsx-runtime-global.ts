// Stand-in for react/jsx-runtime in the design-system bundle (vite.design-system.config.ts).
// The bundle runs as a classic script next to a global React, so compiled JSX must call
// that React's createElement instead of bundling React's own jsx-runtime.
import * as React from 'react';

type Props = Record<string, unknown> | null;

export const Fragment = React.Fragment;

export function jsx(type: React.ElementType, props: Props, key?: React.Key) {
  return React.createElement(type, key === undefined ? props : { ...props, key });
}

export const jsxs = jsx;
export const jsxDEV = jsx;
