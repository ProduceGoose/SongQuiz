// Settings persistence and theme switching. Storage is best effort: it can be
// unavailable (private windows, blocked site data), and the app works without it.
import { defaultSettings, randomName } from '../data/demo';
import type { Settings, Theme } from '../types';

const STORAGE_KEY = 'songquiz.settings';

// A theme the host page set before the app started; "System" restores it.
const hostTheme = document.documentElement.getAttribute('data-theme');

/** The default settings with a random name, for a visitor who has none saved yet. */
export const freshSettings = (): Settings => ({ ...defaultSettings, name: randomName() });

/**
 * The saved settings. A first visit gets a random name, saved at once so it stays the same on
 * the next visit; settings saved before then keep their name.
 */
export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Settings>;
    if (saved.name) return { ...defaultSettings, ...saved };
    const settings = { ...defaultSettings, ...saved, name: randomName() };
    saveSettings(settings);
    return settings;
  } catch {
    return freshSettings();
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
