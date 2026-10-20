// Deciding whether a chat message names the song's title, its artist, or both. Case, accents,
// punctuation, dots in initialisms ("Y.M.C.A."), a leading "The" and a bracketed part like
// "(Are Made of This)" don't matter, and the answer may sit inside a longer message ("is it africa
// toto?"), so a correct answer never shows up in the chat. The title and the artist can come in
// either order, with or without a "by" between them.
import type { Track } from '../types';

/** Letters NFD doesn't split into a base letter and an accent. */
const LETTERS: Record<string, string> = { ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', ł: 'l', đ: 'd' };

export function normalize(text: string): string {
  return text
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[øæœßłđ]/g, (c) => LETTERS[c])
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
  /** Every credited artist of a song that has several ("the weeknd and daft punk"); worth a bonus. */
  allArtists: boolean;
}

function titles(track: Track): string[] {
  return [track.title, track.title.replace(/\([^)]*\)|\[[^\]]*\]/g, '')].map(normalize).filter(Boolean);
}

/** Band names with a comma in them, which mustn't be split into artists at it. */
const COMMA_NAMES = ['Earth, Wind & Fire', 'Tyler, The Creator', 'Crosby, Stills, Nash & Young', 'Peter, Paul and Mary'];

/**
 * The credited artists, each with the names they count by: "The Weeknd, Daft Punk",
 * "Kanye West feat. Jamie Foxx" and a "(feat. …)" or "(with …)" in the title all credit several. A
 * duo of full names like "Daryl Hall & John Oates" is one artist that also counts by either name or
 * by both surnames ("hall and oates"); "Simon & Garfunkel" counts only as a whole.
 */
function credits(track: Track): string[][] {
  let artist = track.artist;
  const kept: string[] = [];
  for (const name of COMMA_NAMES) {
    if (artist.toLowerCase().includes(name.toLowerCase())) {
      artist = artist.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `\u0000${kept.length}\u0000`);
      kept.push(name);
    }
  }
  const featured = [...track.title.matchAll(/[([](?:feat\.?|ft\.?|featuring|with)\s+([^)\]]+)[)\]]/gi)].map((m) => m[1]);
  const names = [artist, ...featured]
    .flatMap((s) => s.split(/\s*,\s*|\s+(?:feat\.?|ft\.?|featuring|x|vs\.?)\s+|\s+\/\s+/i))
    .map((s) => s.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[Number(i)]).trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[][] = [];
  for (const name of names) {
    // A featured artist is often in both the artist and the title ("Low Life (feat. The Weeknd)").
    if (seen.has(normalize(name))) continue;
    seen.add(normalize(name));
    const pair = name.split(/\s*&\s*|\s+and\s+/i);
    out.push(pair.length === 2 && pair.every((p) => p.trim().split(/\s+/).length >= 2)
      ? [name, ...pair, `${pair[0].trim().split(/\s+/).pop()} and ${pair[1].trim().split(/\s+/).pop()}`]
      : [name]);
  }
  return out;
}

/** The ways a name can be typed: as written, "P!nk" as "pink", "Ty Dolla $ign" as "ty dolla sign", and without spaces ("acdc"). */
function spellings(names: string[]): string[] {
  return names
    .flatMap((n) => [n, n.replace(/!/g, 'i').replace(/\$/g, 's'), n.replace(/[!$]/g, '')])
    .map(normalize)
    .flatMap((n) => [n, n.replace(/ /g, '')])
    .filter(Boolean);
}

export function checkGuess(message: string, track: Track): Named {
  const said = ' ' + normalize(message) + ' ';
  const says = (answers: string[]) => answers.some((a) => said.includes(' ' + a + ' '));
  const artists = credits(track).map(spellings);
  const named = artists.filter(says).length;
  return {
    title: says(titles(track)),
    artist: named > 0 || says(spellings([track.artist])),
    allArtists: artists.length > 1 && named === artists.length
  };
}
