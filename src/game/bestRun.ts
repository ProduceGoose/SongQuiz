// The best solo Survival run on this device (game/survival.ts), kept in the browser's storage.
// Browser only; Coop rooms on the server don't keep one.
import type { RunResult } from '../types';

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
  const best = bestRun();
  const better = !best || run.songs > best.songs || (run.songs === best.songs && run.points > best.points);
  if (better) {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ ...run, best: true }));
    } catch {
      // Not saved; the run still counts for this game.
    }
  }
  return better;
}
