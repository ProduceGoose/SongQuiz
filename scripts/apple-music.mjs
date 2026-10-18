// Finds every song in src/data/playlists.json on Apple Music (via the iTunes Search API) and saves
// its Apple id, Apple Music link and cover art next to it. The game looks up the 30-second preview
// by that id when a round starts, so the saved data never goes stale.
//
//   npm run apple-music            look up songs that have no Apple data yet
//   npm run apple-music -- --all   look up every song again
//
// Apple allows about 20 searches a minute, so this waits 3.5 s between songs. Progress is saved
// after each song; run it again to continue. Songs it can't match safely are listed at the end:
// add their "apple" entry by hand, or fix the title or artist so the search finds them.
import fs from 'node:fs';

const FILE = new URL('../src/data/playlists.json', import.meta.url);
const PAUSE_MS = 3500;
const all = process.argv.includes('--all');

/** Words that mark a version other than the original recording. */
const NOT_ORIGINAL = /karaoke|tribute|made famous|in the style of|cover|instrumental|re-?recorded|lullaby|piano version|acoustic|\blive\b|remix|sped up|slowed/i;

const normalize = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  .replace(/[’'`.]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/^the /, '');
const bareTitle = (title) => title.replace(/\([^)]*\)/g, '').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The best Apple result for a song, or null when none is clearly the original. */
function pick(track, results) {
  const artist = normalize(track.artist);
  const title = normalize(bareTitle(track.title));
  let best = null;
  for (const r of results) {
    if (r.kind !== 'song' || !r.previewUrl) continue;
    const rArtist = normalize(r.artistName);
    const rTitle = normalize(bareTitle(r.trackName));
    if (!rArtist.includes(artist) && !artist.includes(rArtist)) continue;
    if (!rTitle.startsWith(title)) continue;
    const extra = `${r.trackName} ${r.collectionName}`;
    if (NOT_ORIGINAL.test(extra) && !NOT_ORIGINAL.test(track.title)) continue;
    const year = Number(String(r.releaseDate).slice(0, 4));
    const score = (normalize(r.trackName) === normalize(track.title) || rTitle === title ? 10 : 0) - Math.min(10, Math.abs(year - track.year));
    if (!best || score > best.score) best = { score, r };
  }
  if (!best) return null;
  const { r } = best;
  return {
    id: r.trackId,
    url: r.trackViewUrl.replace(/[?&]uo=\d+/, ''),
    // Any size works: the app swaps {size} for e.g. 600 (see artworkUrl in src/data/demo.ts).
    artwork: r.artworkUrl100.replace(/\/100x100bb\./, '/{size}x{size}bb.')
  };
}

/** Same layout as the file was written in: one line per song. */
function format(data) {
  return '[\n' + data.map((p) => {
    const { tracks, ...head } = p;
    const lines = Object.entries(head).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
    lines.push(`    "tracks": [\n${tracks.map((t) => '      ' + JSON.stringify(t)).join(',\n')}\n    ]`);
    return '  {\n' + lines.join(',\n') + '\n  }';
  }).join(',\n') + '\n]\n';
}

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const todo = data.flatMap((p) => p.tracks).filter((t) => all || !t.apple);
const missed = [];
console.log(`Looking up ${todo.length} songs…`);

for (const [i, track] of todo.entries()) {
  const term = `${track.artist} ${bareTitle(track.title)}`;
  const url = `https://itunes.apple.com/search?${new URLSearchParams({ term, entity: 'song', limit: '50', country: 'US' })}`;
  let found = null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    found = pick(track, (await res.json()).results);
  } catch (err) {
    console.log(`  ! ${track.artist} – ${track.title}: ${err.message}`);
  }
  if (found) {
    track.apple = found;
    fs.writeFileSync(FILE, format(data));
    console.log(`${i + 1}/${todo.length} ✓ ${track.artist} – ${track.title}`);
  } else {
    missed.push(track);
    console.log(`${i + 1}/${todo.length} ✗ ${track.artist} – ${track.title}`);
  }
  if (i < todo.length - 1) await sleep(PAUSE_MS);
}

console.log(missed.length ? `\nNo safe match for:\n${missed.map((t) => `  ${t.artist} – ${t.title}`).join('\n')}` : '\nEvery song matched.');
