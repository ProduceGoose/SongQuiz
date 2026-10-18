import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Order matters: tokens, then the rules all components share, then the app
// (which brings in each component's own styles), then the page styles.
import 'virtual:design-tokens.css';
import './components/base.css';
import { App } from './App';
import './App.css';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
