// Settings persistence and theme switching. Storage is best effort: it can be
// unavailable (private windows, blocked site data), and the app works without it.
import { defaultSettings } from '../data/demo';
import type { Settings, Theme } from '../types';

const STORAGE_KEY = 'songquiz.settings';

// A theme the host page set before the app started; "System" restores it.
const hostTheme = document.documentElement.getAttribute('data-theme');

export function loadSettings(): Settings {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Not saved; the app keeps working with the in-memory settings.
  }
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const value = theme === 'system' ? hostTheme : theme;
  if (value) root.setAttribute('data-theme', value);
  else root.removeAttribute('data-theme');
}
