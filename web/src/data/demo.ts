// Demo content for the SongQuiz prototype. Every room, player and score here is example data.
import { ME, type PastGame, type Playlist, type Room, type RoomOptions, type Settings, type Track } from '../types';

// ---- Cover art -----------------------------------------------------------------
// Flat geometric SVGs stand in for real album covers.
const PALETTES = [
  ['#d9472b', '#f6d36b'], ['#1b3a5c', '#e9e2cf'], ['#2f7d5b', '#f1efe6'], ['#f2c14e', '#1c1c1c'],
  ['#7a2e8e', '#f4b6c2'], ['#e8e3d8', '#c0392b'], ['#0f4c81', '#ff8c42'], ['#3a3a3a', '#e5e5e5']
];

function coverArt(i: number): string {
  const [bg, fg] = PALETTES[i % PALETTES.length];
  const shapes = [
    `<circle cx="50" cy="54" r="28" fill="${fg}"/>`,
    `<path d="M0 60h100v9H0zM0 76h100v9H0zM0 92h100v8H0z" fill="${fg}"/>`,
    `<path d="M0 100L100 20v80z" fill="${fg}"/>`,
    `<path d="M14 74a36 36 0 0 1 72 0z" fill="${fg}"/><path d="M0 78h100v22H0z" fill="${fg}" opacity=".5"/>`,
    `<path d="M20 20h28v28H20zM52 52h28v28H52z" fill="${fg}"/>`
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${bg}"/>${shapes[i % shapes.length]}</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// ---- Playlists -----------------------------------------------------------------
const t = (title: string, artist: string, year: number): Track => ({ title, artist, year });

const PLAYLIST_DATA: Array<Omit<Playlist, 'art' | 'subtitle'>> = [
  {
    id: 'synth-80s', title: '80s Synth Hits', era: '1980s', level: 'Easy', songs: 48,
    description: 'Big drums, bigger choruses. A safe opener for any group.',
    tracks: [t('Take On Me', 'a-ha', 1985), t('Girls Just Want to Have Fun', 'Cyndi Lauper', 1983), t('Sweet Dreams (Are Made of This)', 'Eurythmics', 1983), t('Don’t You Want Me', 'The Human League', 1981), t('Tainted Love', 'Soft Cell', 1981), t('Africa', 'Toto', 1982), t('Billie Jean', 'Michael Jackson', 1983), t('Just Can’t Get Enough', 'Depeche Mode', 1981)]
  },
  {
    id: 'eurovision', title: 'Eurovision Bangers', era: '1974–2021', level: 'Medium', songs: 36,
    description: 'Winners, wildcards and key changes from the song contest.',
    tracks: [t('Waterloo', 'ABBA', 1974), t('Euphoria', 'Loreen', 2012), t('Fairytale', 'Alexander Rybak', 2009), t('Hard Rock Hallelujah', 'Lordi', 2006), t('Satellite', 'Lena', 2010), t('Arcade', 'Duncan Laurence', 2019), t('Zitti e buoni', 'Måneskin', 2021), t('Toy', 'Netta', 2018)]
  },
  {
    id: 'soundtracks', title: 'Movie Soundtracks', era: '1977–2018', level: 'Easy', songs: 40,
    description: 'Songs you know from the big screen, ballads to training montages.',
    tracks: [t('My Heart Will Go On', 'Céline Dion', 1997), t('Eye of the Tiger', 'Survivor', 1982), t('Ghostbusters', 'Ray Parker Jr.', 1984), t('Footloose', 'Kenny Loggins', 1984), t('(I’ve Had) The Time of My Life', 'Bill Medley & Jennifer Warnes', 1987), t('Stayin’ Alive', 'Bee Gees', 1977), t('Let It Go', 'Idina Menzel', 2013), t('Shallow', 'Lady Gaga & Bradley Cooper', 2018)]
  },
  {
    id: 'y2k-pop', title: 'Y2K Pop', era: '2000s', level: 'Easy', songs: 52,
    description: 'Flip phones, frosted tips and every chorus you still know by heart.',
    tracks: [t('Toxic', 'Britney Spears', 2003), t('Crazy in Love', 'Beyoncé', 2003), t('Hey Ya!', 'OutKast', 2003), t('Since U Been Gone', 'Kelly Clarkson', 2004), t('Hips Don’t Lie', 'Shakira', 2006), t('Umbrella', 'Rihanna', 2007), t('Poker Face', 'Lady Gaga', 2008), t('Mr. Brightside', 'The Killers', 2004)]
  },
  {
    id: 'stadium-rock', title: 'Stadium Rock', era: '1975–2003', level: 'Medium', songs: 44,
    description: 'Riffs that fill arenas. Expect air guitar.',
    tracks: [t('Bohemian Rhapsody', 'Queen', 1975), t('Livin’ on a Prayer', 'Bon Jovi', 1986), t('Sweet Child o’ Mine', 'Guns N’ Roses', 1987), t('Don’t Stop Believin’', 'Journey', 1981), t('We Will Rock You', 'Queen', 1977), t('Wonderwall', 'Oasis', 1995), t('Seven Nation Army', 'The White Stripes', 2003), t('Smells Like Teen Spirit', 'Nirvana', 1991)]
  },
  {
    id: 'disco', title: 'Disco Fever', era: '1970s', level: 'Medium', songs: 32,
    description: 'Four-on-the-floor classics. Spot the bass line in two seconds.',
    tracks: [t('Dancing Queen', 'ABBA', 1976), t('I Will Survive', 'Gloria Gaynor', 1978), t('Le Freak', 'Chic', 1978), t('September', 'Earth, Wind & Fire', 1978), t('Hot Stuff', 'Donna Summer', 1979), t('Y.M.C.A.', 'Village People', 1978), t('Don’t Leave Me This Way', 'Thelma Houston', 1976), t('Good Times', 'Chic', 1979)]
  },
  {
    id: 'hiphop-90s', title: '90s Hip-Hop', era: '1990s', level: 'Hard', songs: 38,
    description: 'Golden-era beats. The intros are short, so listen closely.',
    tracks: [t('Juicy', 'The Notorious B.I.G.', 1994), t('Gin and Juice', 'Snoop Doggy Dogg', 1994), t('California Love', '2Pac', 1995), t('Gangsta’s Paradise', 'Coolio', 1995), t('Nuthin’ but a “G” Thang', 'Dr. Dre', 1992), t('C.R.E.A.M.', 'Wu-Tang Clan', 1994), t('Shook Ones, Pt. II', 'Mobb Deep', 1995), t('Hypnotize', 'The Notorious B.I.G.', 1997)]
  },
  {
    id: 'indie', title: 'Indie Sing-Alongs', era: '2004–2013', level: 'Hard', songs: 30,
    description: 'Festival favourites with whoa-ohs to shout along to.',
    tracks: [t('Take Me Out', 'Franz Ferdinand', 2004), t('Float On', 'Modest Mouse', 2004), t('Rebellion (Lies)', 'Arcade Fire', 2005), t('Young Folks', 'Peter Bjorn and John', 2006), t('Electric Feel', 'MGMT', 2008), t('Pumped Up Kicks', 'Foster the People', 2010), t('Ho Hey', 'The Lumineers', 2012), t('Do I Wanna Know?', 'Arctic Monkeys', 2013)]
  }
];

export const playlists: Playlist[] = PLAYLIST_DATA.map((p, i) => ({ ...p, art: coverArt(i), subtitle: `${p.songs} songs` }));

export function playlistById(id: string | undefined): Playlist {
  return playlists.find((p) => p.id === id) ?? playlists[0];
}

// ---- Rooms ---------------------------------------------------------------------
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

export function demoRoom(myName: string): Room {
  return {
    name: 'Friday Night Room', code: 'KX7Q', hostId: 'malik',
    playlistId: 'synth-80s', rounds: 10, mode: 'covers', snippet: 20, maxPlayers: 8,
    players: [
      { id: 'malik', name: 'Malik', ready: true },
      { id: 'priya', name: 'Priya', ready: true },
      { id: ME, name: myName, ready: false },
      { id: 'jonas', name: 'Jonas', ready: false },
      { id: 'sam', name: 'Sam', ready: true }
    ]
  };
}

/** KX7Q joins the demo room; any other valid code makes up a room. */
export function joinRoom(code: string, myName: string): Room {
  if (code === 'KX7Q') return demoRoom(myName);
  return {
    name: 'Room ' + code, code, hostId: 'alex',
    playlistId: 'y2k-pop', rounds: 10, mode: 'typed', snippet: 20, maxPlayers: 8,
    players: [
      { id: 'alex', name: 'Alex', ready: true },
      { id: 'noor', name: 'Noor', ready: false },
      { id: ME, name: myName, ready: false }
    ]
  };
}

export function newRoom(options: RoomOptions, myName: string): Room {
  return {
    name: options.name, code: randomCode(), hostId: ME,
    playlistId: options.playlistId, rounds: Number(options.rounds), mode: options.mode,
    snippet: Number(options.snippet), maxPlayers: Number(options.maxPlayers),
    players: [{ id: ME, name: myName, ready: true }]
  };
}

// ---- Past games ----------------------------------------------------------------
export const pastGames: PastGame[] = [
  {
    id: 'g-oct10', date: 'Oct 10', room: 'Friday Night Room', playlistId: 'synth-80s',
    players: [
      { id: 'malik', name: 'Malik', score: 5360, streak: 4 },
      { id: ME, score: 4820, streak: 3 },
      { id: 'priya', name: 'Priya', score: 4210, streak: 2 },
      { id: 'jonas', name: 'Jonas', score: 3980, streak: 1 },
      { id: 'sam', name: 'Sam', score: 3110, streak: 1 },
      { id: 'noor', name: 'Noor', score: 2875 }
    ]
  },
  {
    id: 'g-oct03', date: 'Oct 3', room: 'Office Party', playlistId: 'y2k-pop',
    players: [
      { id: 'priya', name: 'Priya', score: 6120, streak: 5 },
      { id: 'theo', name: 'Theo', score: 5480, streak: 3 },
      { id: ME, score: 5010, streak: 2 },
      { id: 'ava', name: 'Ava', score: 4400, streak: 2 },
      { id: 'jonas', name: 'Jonas', score: 3920, streak: 1 },
      { id: 'sam', name: 'Sam', score: 3305 },
      { id: 'noor', name: 'Noor', score: 2980 },
      { id: 'malik', name: 'Malik', score: 2410 }
    ]
  },
  {
    id: 'g-sep26', date: 'Sep 26', room: 'Road Trip', playlistId: 'stadium-rock',
    players: [
      { id: ME, score: 4650, streak: 4 },
      { id: 'sam', name: 'Sam', score: 4100, streak: 2 },
      { id: 'jonas', name: 'Jonas', score: 3770, streak: 2 },
      { id: 'ava', name: 'Ava', score: 2890, streak: 1 }
    ]
  }
];

export const defaultSettings: Settings = { name: 'Lena', theme: 'system', volume: 70, covers: 'on' };
