// Apple Music previews: 30 seconds of each song, looked up by its Apple id (Track.apple.id).
// Used by the server for online rooms and by the browser for the demo room. The preview address
// is looked up fresh each time, because Apple can change it.

/** Length of every Apple preview. */
export const PREVIEW_SECONDS = 30;
/** How long the answer stays up before the next round; the song keeps playing meanwhile. */
export const REVEAL_SECONDS = 5;
/** Players always get at least this long to guess, however short the snippet. */
export const MIN_ROUND_SECONDS = 20;

/** A round's guessing time for a snippet length. */
export const roundSeconds = (snippet: number) => Math.max(snippet, MIN_ROUND_SECONDS);

/** Seconds of the round played so far; it stands still while the round is paused. */
export function roundElapsed(round: { startedAt: number; pausedAt?: number }, now = Date.now()): number {
  return ((round.pausedAt ?? now) - round.startedAt) / 1000;
}

/** Preview addresses on Apple's servers by Apple id, in one request; songs without one are left out. */
export async function lookupPreviews(appleIds: number[]): Promise<Map<number, string>> {
  const found = new Map<number, string>();
  if (!appleIds.length) return found;
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${appleIds.join(',')}`);
    if (!res.ok) return found;
    const json = (await res.json()) as { results?: Array<{ trackId?: number; previewUrl?: string }> };
    for (const r of json.results ?? []) if (r.trackId && r.previewUrl) found.set(r.trackId, r.previewUrl);
  } catch {
    // Offline or blocked: no previews.
  }
  return found;
}

/** The song's preview address on Apple's servers, or null if it has none. */
export async function lookupPreview(appleId: number): Promise<string | null> {
  return (await lookupPreviews([appleId])).get(appleId) ?? null;
}

/** The songs in random order, songs with an Apple preview first, so rounds without sound come last. */
export function gameOrder<T extends { apple?: unknown }>(tracks: T[]): T[] {
  const shuffle = (list: T[]) => {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
  };
  return [...shuffle(tracks.filter((t) => t.apple)), ...shuffle(tracks.filter((t) => !t.apple))];
}

/**
 * Where in the preview a round starts, in seconds: random, but leaving enough preview for the
 * round and the reveal. A 30-second round always starts at 0.
 */
export function snippetOffset(roundSeconds: number): number {
  const spare = PREVIEW_SECONDS - roundSeconds - REVEAL_SECONDS;
  return spare > 0 ? Math.round(Math.random() * spare * 10) / 10 : 0;
}
