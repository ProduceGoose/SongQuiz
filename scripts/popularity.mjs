// Saves how popular each song is, from Deezer's public search (its "rank", 0 to about 1,000,000), in
// src/data/popularity.json, keyed like the previews ("us:1440858688"). Survival (src/game/survival.ts)
// splits every playlist by it into its easy, medium and hard songs.
//
//   npm run popularity           songs that have no popularity yet
//   npm run popularity -- --all  every song again (the numbers change slowly over time)
//
// Deezer allows 50 requests in 5 seconds; this sends one every 150 ms. Progress is saved every 50
// songs; run it again to continue. Songs it can't find keep no number and count as medium.
import fs from 'node:fs';

const PLAYLISTS = new URL('../src/data/playlists.json', import.meta.url);
const FILE = new URL('../src/data/popularity.json', import.meta.url);
const PAUSE_MS = 150;
const all = process.argv.includes('--all');

/** Words that mark a version other than the original recording (as in apple-music.mjs). */
const NOT_ORIGINAL = /karaoke|tribute|made famous|in the style of|cover|instrumental|re-?recorded|lullaby|piano version|acoustic|\blive\b|remix|sped up|slowed|\bmixed\b|dj mix|a ?cappella|8-bit|16-bit|emulation/i;

const normalize = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  .replace(/[’'`.]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/^the /, '');
const bareTitle = (title) => title.replace(/\([^)]*\)|\[[^\]]*\]/g, '').replace(/\s+-\s+.*$/, '').trim();
const leadArtist = (artist) => artist.split(/,|&|\/|\bfeat\b/i)[0].trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const data = JSON.parse(fs.readFileSync(PLAYLISTS, 'utf8'));
const saved = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
const songs = new Map();
for (const t of data.flatMap((p) => p.tracks)) {
  if (t.apple) songs.set(`${t.apple.store ?? 'us'}:${t.apple.id}`, t);
}
const todo = [...songs].filter(([key]) => all || !(key in saved));
const missed = [];
console.log(`Looking up ${todo.length} of ${songs.size} songs on Deezer…`);

/** The highest rank among results that are this song in its original version, or null. */
async function rankOf(track) {
  const title = normalize(bareTitle(track.title)) || normalize(track.title);
  const lead = normalize(leadArtist(track.artist));
  const q = `${leadArtist(track.artist)} ${bareTitle(track.title)}`;
  const res = await fetch(`https://api.deezer.com/search?${new URLSearchParams({ q, limit: '25' })}`);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? 'Deezer error');
  let best = null;
  for (const r of json.data ?? []) {
    const rTitle = normalize(bareTitle(r.title ?? ''));
    const rArtist = normalize(r.artist?.name ?? '');
    if (rTitle !== title && normalize(r.title ?? '') !== title) continue;
    if (!` ${rArtist} `.includes(` ${lead} `) && !` ${lead} `.includes(` ${rArtist} `)) continue;
    if (NOT_ORIGINAL.test(`${r.title} ${r.album?.title ?? ''}`) && !NOT_ORIGINAL.test(track.title)) continue;
    if (best === null || r.rank > best) best = r.rank;
  }
  return best;
}

const write = () => fs.writeFileSync(FILE, JSON.stringify(saved, null, 0).replace(/,"/g, ',\n"') + '\n');
for (const [i, [key, track]] of todo.entries()) {
  try {
    const rank = await rankOf(track);
    if (rank === null) missed.push(track);
    else saved[key] = rank;
  } catch (err) {
    console.log(`  ! ${track.artist} – ${track.title}: ${err.message}`);
    await sleep(5000);
  }
  if (i % 50 === 49) {
    write();
    console.log(`${i + 1}/${todo.length}`);
  }
  await sleep(PAUSE_MS);
}
write();
console.log(`\nSaved ${Object.keys(saved).length} of ${songs.size}.` + (missed.length ? ` Not found on Deezer (they count as medium):\n${missed.map((t) => `  ${t.artist} – ${t.title}`).join('\n')}` : ''));
