import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Design system: tokens (compiled from tokens.json) and component styles.
import 'virtual:design-tokens.css';
import '@songquiz/ui/styles.css';
// This site's own layout and screen styles.
import './styles/app.css';
import { App } from './App';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
