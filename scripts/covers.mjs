// Makes the playlist covers the app shows: each big PNG in public/assets/PlaylistCoverArt becomes a
// 512 px WebP in public/assets/covers, named after its playlist's id. The ids are listed in
// src/data/covers.json, which tells the app which playlists have a cover (see src/data/demo.ts).
// The app shows covers at most 160 px wide, so 512 px stays sharp on high-density screens while each
// file is a few dozen KB instead of several MB.
//
//   npm run covers
//
// For a new cover, put its PNG into the source folder, add a line to COVERS and run this again.
import fs from 'node:fs';
import sharp from 'sharp';

const SOURCE = new URL('../public/assets/PlaylistCoverArt/PlaylistCoverArt/', import.meta.url);
const TARGET = new URL('../public/assets/covers/', import.meta.url);
const SIZE = 512;

/** Playlist id → cover file in SOURCE. */
const COVERS = {
  'synth-80s': '80sPlaylistCoverArt.png',
  'y2k-pop': 'Y2KCover.png',
  '2010s': '2010sCover.png',
  indie: 'IndiesCover.png',
  2020: '2020sCover.png',
  'birthday-song-quiz': 'BirthdayCover.png',
  '90s': '90sCover.png',
  '70s': '70sCover.png',
  hiphopMix: 'HipHopCover.png',
  pop: 'PopCover.png',
  rock: 'RockCover.png',
  deutschrap: 'DeutschRapCover.png',
  greatesthits: 'GreatestHitsCover.png',
  2016: '2016Cover.png',
  memesongs: 'MemeCover.png',
  coronasongs: 'CoronaCover.png',
  random: 'RandomCover.png'
};

const LIST = new URL('../src/data/covers.json', import.meta.url);

fs.mkdirSync(TARGET, { recursive: true });
for (const [id, file] of Object.entries(COVERS)) {
  const out = new URL(`${id}.webp`, TARGET);
  await sharp(fs.readFileSync(new URL(file, SOURCE))).resize(SIZE, SIZE, { fit: 'cover' }).webp({ quality: 82 }).toFile(out.pathname.replace(/^\/(\w:)/, '$1'));
  console.log(`${file} → covers/${id}.webp (${Math.round(fs.statSync(out).size / 1024)} KB)`);
}
fs.writeFileSync(LIST, JSON.stringify(Object.keys(COVERS), null, 2) + '\n');
