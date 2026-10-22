// Finds every song in src/data/playlists.json on Apple Music (via the iTunes Search API) and saves
// its Apple id, Apple Music link and cover art next to it.
//
// It searches the US store first, then the German one (STORES). A song only found in another
// store gets that store saved with it ("store": "de"), so the game looks its preview up there.
//
// At the end it saves every song's 30-second preview address in src/data/previews.json, which only
// the server reads: Apple refuses most lookups from Cloudflare's servers (HTTP 403), so online rooms
// play these instead of looking each song up during the game. Apple rarely moves a preview; run
// this again (--previews is enough) if songs in online rooms go silent.
//
//   npm run apple-music                           look up songs that have no Apple data yet
//   npm run apple-music -- --all                  look up every song again
//   npm run apple-music -- --playlist deutschrap  only one playlist (also works with --all)
//   npm run apple-music -- --previews             only refresh src/data/previews.json
//
// Apple's search leaves out every song marked explicit (most rap), so when it finds nothing the
// script looks in the albums of the versions it did find (often an instrumental), then in each of
// the song's artists' songs (up to 200 per artist). The same recording on a sampler ("Bravo Hits")
// is only used when the artist's own release can't be found.
//
// Apple allows about 20 requests a minute, so this waits 3.5 s between them. Progress is saved
// after each song; run it again to continue. Songs it can't match safely are listed at the end:
// add their "apple" entry by hand, or fix the title or artist so the search finds them.
import fs from 'node:fs';

const FILE = new URL('../src/data/playlists.json', import.meta.url);
const PREVIEWS = new URL('../src/data/previews.json', import.meta.url);
const PAUSE_MS = 3500;
/** Apple Music stores to search, in order. */
const STORES = ['US', 'DE'];
const all = process.argv.includes('--all');
const only = process.argv.includes('--playlist') ? process.argv[process.argv.indexOf('--playlist') + 1] : null;
const previewsOnly = process.argv.includes('--previews');

/** Words that mark a version other than the original recording. */
const NOT_ORIGINAL = /karaoke|tribute|made famous|in the style of|cover|instrumental|re-?recorded|lullaby|piano version|acoustic|\blive\b|remix|sped up|slowed|\bmixed\b|dj mix|a ?cappella|outtake|roughs|\bdemo\b|\bextended\b|\bdub\b/i;

const normalize = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  .replace(/[’'`.]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/^the /, '');
/** A title without bracketed parts ("(feat. X)", "[Remix]") or a " - Radio Edit"-style suffix. */
const bareTitle = (title) => title.replace(/\([^)]*\)|\[[^\]]*\]/g, '').replace(/\s+-\s+.*$/, '').trim();
/** Each artist of "A, B & C feat. D". */
const artists = (artist) => artist.split(/,|&|\/|\bfeat\b/i).map((a) => a.trim()).filter(Boolean);
const leadArtist = (artist) => artists(artist)[0];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let lastRequest = 0;
/** One iTunes API request, at most one every PAUSE_MS. */
async function apple(path, params) {
  await sleep(Math.max(0, lastRequest + PAUSE_MS - Date.now()));
  lastRequest = Date.now();
  const res = await fetch(`https://itunes.apple.com/${path}?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return (await res.json()).results;
}

/** Every song of an artist in a store (explicit ones too), by artist name; [] when not found. */
const artistSongs = new Map();
async function songsOf(name, store) {
  const key = `${store}:${normalize(name)}`;
  if (!artistSongs.has(key)) {
    const found = (await apple('search', { term: name, entity: 'musicArtist', limit: '10', country: store }))
      .find((a) => normalize(a.artistName) === normalize(name));
    artistSongs.set(key, found
      ? (await apple('lookup', { id: found.artistId, entity: 'song', limit: '200', country: store })).filter((r) => r.wrapperType === 'track')
      : []);
  }
  return artistSongs.get(key);
}

/** Whether `name` is a whole word or words of `text` ("cro" is in "cro and x", not in "vycro diva"). */
const hasWords = (text, name) => ` ${text} `.includes(` ${name} `);
/** A "Bravo Hits"-style sampler: the right recording, but with the sampler's cover. */
// The German store names their artist "Verschiedene Interpret:innen".
const isCompilation = (r) => /^(various artists|verschiedene interpret)/i.test(r.collectionArtistName ?? '');

/** Whether an Apple result is this song by these artists, in any version (instrumental, remix…). */
function sameSong(track, r) {
  if (r.kind !== 'song') return false;
  const rArtist = normalize(r.artistName);
  // A name in another script (e.g. Japanese) normalizes to nothing, which every artist "includes".
  if (!rArtist) return false;
  // Several artists are written "A, B" here but "A & B" on Apple, so the first one has to match.
  // Or Apple names just one of them; the whole name, so "Eazy" isn't taken for "G-Eazy".
  if (!hasWords(rArtist, normalize(leadArtist(track.artist))) && !artists(track.artist).some((a) => normalize(a) === rArtist)) return false;
  // A title that is only punctuation outside its brackets ("! (The Song Formerly Known As)") would be
  // empty; then the whole title has to match.
  const title = normalize(bareTitle(track.title)) || normalize(track.title);
  // Exact, not a prefix: "Berlin lebt" is a different song from "Berlin lebt wie nie zuvor".
  return normalize(bareTitle(r.trackName)) === title || normalize(r.trackName) === title;
}

/** The best Apple result for a song, or null when none is clearly the original. */
function pick(track, results) {
  // What the title says about the version ("Seeb Remix", "feat. Kai"): a result naming it is closer.
  const parts = [...track.title.matchAll(/\(([^)]*)\)|\[([^\]]*)\]|\s-\s(.*)$/g)].map((m) => normalize(m[1] ?? m[2] ?? m[3])).filter(Boolean);
  let best = null;
  for (const r of results) {
    if (!r.previewUrl || !sameSong(track, r)) continue;
    const extra = `${r.trackName} ${r.collectionName}`;
    if (NOT_ORIGINAL.test(extra) && !NOT_ORIGINAL.test(track.title)) continue;
    const year = Number(String(r.releaseDate).slice(0, 4));
    const named = parts.filter((p) => hasWords(normalize(extra), p)).length;
    const score = -Math.min(10, Math.abs(year - track.year)) - (isCompilation(r) ? 5 : 0) + 3 * named;
    if (!best || score > best.score) best = { score, r };
  }
  return best?.r ?? null;
}

/** The "apple" entry saved for a song. */
const appleEntry = (r, store) => ({
  id: r.trackId,
  url: r.trackViewUrl.replace(/[?&]uo=\d+/, ''),
  // Any size works: the app swaps {size} for e.g. 600 (see artworkUrl in src/data/demo.ts).
  artwork: r.artworkUrl100.replace(/\/100x100bb\./, '/{size}x{size}bb.'),
  ...(store !== 'US' && { store: store.toLowerCase() })
});

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
if (only && !data.some((p) => p.id === only)) throw new Error(`No playlist with id "${only}"`);
const todo = previewsOnly ? [] : data.filter((p) => !only || p.id === only).flatMap((p) => p.tracks).filter((t) => all || !t.apple);
const missed = [];
console.log(`Looking up ${todo.length} songs…`);

for (const [i, track] of todo.entries()) {
  // Only the lead artist: with every featured artist in it, the search often finds nothing.
  const term = `${leadArtist(track.artist)} ${bareTitle(track.title)}`;
  // The first original found, from the cheapest source first. A compilation is kept only until
  // the artist's own release turns up, in this store or the next.
  let best = null;
  stores: for (const store of STORES) {
    try {
      const results = await apple('search', { term, entity: 'song', limit: '50', country: store });
      // Search leaves out explicit songs but not their instrumentals: the album of one has the original.
      const albums = [...new Set(results.filter((r) => sameSong(track, r) && !isCompilation(r)).map((r) => r.collectionId))].slice(0, 10);
      const sources = [
        async () => results,
        async () => albums.length ? apple('lookup', { id: albums.join(','), entity: 'song', country: store }) : [],
        ...artists(track.artist).map((name) => () => songsOf(name, store))
      ];
      for (const source of sources) {
        const r = pick(track, await source());
        if (r && (!best || (isCompilation(best.r) && !isCompilation(r)))) best = { r, store };
        if (best && !isCompilation(best.r)) break stores;
      }
    } catch (err) {
      console.log(`  ! ${track.artist} – ${track.title} (${store}): ${err.message}`);
    }
  }
  const found = best && appleEntry(best.r, best.store);
  if (found) {
    track.apple = found;
    fs.writeFileSync(FILE, format(data));
    console.log(`${i + 1}/${todo.length} ✓ ${track.artist} – ${track.title}${found.store ? ` (${found.store} store)` : ''}`);
  } else {
    missed.push(track);
    console.log(`${i + 1}/${todo.length} ✗ ${track.artist} – ${track.title}`);
  }
}

if (!previewsOnly) console.log(missed.length ? `\nNo safe match for:\n${missed.map((t) => `  ${t.artist} – ${t.title}`).join('\n')}` : '\nEvery song matched.');

// ---- Preview addresses for the server ----
// Keyed "store:id" (see previewKey in src/game/preview.ts), looked up 150 songs per request.
const songs = new Map(data.flatMap((p) => p.tracks).filter((t) => t.apple).map((t) => [`${t.apple.store ?? 'us'}:${t.apple.id}`, t]));
const previews = {};
const byStore = {};
for (const key of songs.keys()) {
  const [store, id] = key.split(':');
  (byStore[store] ??= []).push(id);
}
console.log(`\nSaving preview addresses for ${songs.size} songs…`);
for (const [store, ids] of Object.entries(byStore)) {
  for (let i = 0; i < ids.length; i += 150) {
    for (const r of await apple('lookup', { id: ids.slice(i, i + 150).join(','), country: store })) {
      if (r.wrapperType === 'track' && r.previewUrl) previews[`${store}:${r.trackId}`] = r.previewUrl;
    }
  }
}
const without = [...songs].filter(([key]) => !previews[key]).map(([, t]) => `  ${t.artist} – ${t.title}`);
fs.writeFileSync(PREVIEWS, JSON.stringify(previews, null, 0).replace(/,"/g, ',\n"') + '\n');
console.log(`Saved ${Object.keys(previews).length} to src/data/previews.json.` + (without.length ? ` No preview on Apple for:\n${without.join('\n')}` : ''));
