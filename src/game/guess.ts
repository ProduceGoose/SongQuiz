// Deciding whether a chat message names the song. Case, accents, punctuation, dots in initialisms
// ("Y.M.C.A."), a leading "The" and a bracketed part like "(Are Made of This)" don't matter, and the
// title may sit inside a longer message ("is it africa?"), so a correct answer never shows up in the chat.
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

export function isCorrectGuess(message: string, track: Track): boolean {
  const said = ' ' + normalize(message) + ' ';
  const titles = [track.title, track.title.replace(/\([^)]*\)/g, '')].map(normalize).filter(Boolean);
  return titles.some((title) => said.includes(' ' + title + ' '));
}
