// The best solo Survival run on this device (game/survival.ts), kept in the browser's storage.
// Browser only; a Coop room's best run is kept by its server (worker/RoomObject.ts).
import type { RunResult } from '../types';
import { beatsRun } from './survival';

const BEST_KEY = 'iquiz.survival.best';

/** The best run on this device: the most songs, then the most points. Null if none or no storage. */
export function bestRun(): RunResult | null {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? 'null') as RunResult | null;
  } catch {
    return null;
  }
}

/** Saves the run if it beats the best one; true if it did. */
export function recordRun(run: Omit<RunResult, 'best'>): boolean {
  const better = beatsRun(run, bestRun());
  if (better) {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ ...run, best: true }));
    } catch {
      // Not saved; the run still counts for this game.
    }
  }
  return better;
}
