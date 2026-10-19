// Deciding whether a chat message names the song's title, its artist, or both. Case, accents,
// punctuation, dots in initialisms ("Y.M.C.A."), a leading "The" and a bracketed part like
// "(Are Made of This)" don't matter, and the answer may sit inside a longer message ("is it africa
// by toto?"), so a correct answer never shows up in the chat.
import type { Track } from '../types';

export function normalize(text: string): string {
  return text
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[’'`.]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^the /, '');
}

/** Which parts of the song a message names. */
export interface Named {
  title: boolean;
  artist: boolean;
}

function titles(track: Track): string[] {
  return [track.title, track.title.replace(/\([^)]*\)/g, '')].map(normalize).filter(Boolean);
}

/**
 * The artist as written and without spaces ("acdc", "aha"). A duo of full names like
 * "Daryl Hall & John Oates" also counts by either name, but "Earth, Wind & Fire" doesn't split.
 */
function artists(track: Track): string[] {
  const parts = track.artist.split(/\s*&\s*/);
  const names = parts.length > 1 && parts.every((p) => p.trim().split(/\s+/).length >= 2) ? [track.artist, ...parts] : [track.artist];
  return names.map(normalize).flatMap((n) => [n, n.replace(/ /g, '')]).filter(Boolean);
}

export function checkGuess(message: string, track: Track): Named {
  const said = ' ' + normalize(message) + ' ';
  const says = (answers: string[]) => answers.some((a) => said.includes(' ' + a + ' '));
  return { title: says(titles(track)), artist: says(artists(track)) };
}
