/* Example content shared by the component previews: songs, players, sidebar sections and cover art.
   Loaded by a preview with <script src="../../components/demo/demo-data.js">. */
window.SQDemo = (function () {
  // Flat geometric SVGs stand in for real album covers.
  var PALETTES = [
    ['#d9472b', '#f6d36b'], ['#1b3a5c', '#e9e2cf'], ['#2f7d5b', '#f1efe6'], ['#f2c14e', '#1c1c1c'], ['#7a2e8e', '#f4b6c2'],
    ['#e8e3d8', '#c0392b'], ['#0f4c81', '#ff8c42'], ['#3a3a3a', '#e5e5e5'], ['#f4f1ea', '#1b3a5c'], ['#c2185b', '#ffe0b2']
  ];

  function cover(i) {
    var bg = PALETTES[i % PALETTES.length][0];
    var fg = PALETTES[i % PALETTES.length][1];
    var shapes = [
      '<circle cx="50" cy="54" r="28" fill="' + fg + '"/>',
      '<path d="M0 60h100v9H0zM0 76h100v9H0zM0 92h100v8H0z" fill="' + fg + '"/>',
      '<path d="M0 100L100 20v80z" fill="' + fg + '"/>',
      '<path d="M14 74a36 36 0 0 1 72 0z" fill="' + fg + '"/><path d="M0 78h100v22H0z" fill="' + fg + '" opacity=".5"/>',
      '<path d="M20 20h28v28H20zM52 52h28v28H52z" fill="' + fg + '"/>'
    ];
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="' + bg + '"/>' + shapes[i % shapes.length] + '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  var SONGS = [
    { title: 'Adasdaadadsds', artist: 'a-ha' },
    { title: 'Dancing Queen', artist: 'ABBA' },
    { title: 'Africa', artist: 'Toto' },
    { title: 'Hey Ya!', artist: 'OutKast' },
    { title: 'Poker Face', artist: 'Lady Gaga' },
    { title: 'Wonderwall', artist: 'Oasis' },
    { title: 'Mr. Brightside', artist: 'The Killers' },
    { title: 'Hips Don’t Lie', artist: 'Shakira' },
    { title: 'Bohemian Rhapsody', artist: 'Queen' },
    { title: 'Rolling in the Deep', artist: 'Adele' }
  ];

  var PLAYERS = [
    { id: 'lena', name: 'Lena', note: '(you)', score: 4820, delta: 120, streak: 3, status: 'correct' },
    { id: 'malik', name: 'Malik', score: 5360, delta: 140, streak: 4, status: 'correct' },
    { id: 'priya', name: 'Priya', score: 4210, streak: 0, status: 'wrong' },
    { id: 'jonas', name: 'Jonas', score: 3980, delta: 90, streak: 1, status: 'correct' },
    { id: 'sam', name: 'Sam', score: 3110, streak: 0, status: 'locked' },
    { id: 'noor', name: 'Noor', score: 2875, streak: 0, status: 'guessing' },
    { id: 'theo', name: 'Theo', score: 2410, streak: 0, status: 'guessing' },
    { id: 'ava', name: 'Ava', score: 1990, streak: 0, status: 'away' }
  ];

  var SECTIONS = [
    { title: 'Room', items: [
      { id: 'room', label: 'Friday Night Room', icon: 'broadcast', badge: 8 },
      { id: 'round', label: 'Current round', icon: 'music' },
      { id: 'scores', label: 'Scores', icon: 'trophy' }
    ] },
    { title: 'Players', collapsible: true, items: [
      { id: 'p-malik', label: 'Malik', icon: 'user', badge: '5,360' },
      { id: 'p-lena', label: 'Lena (you)', icon: 'user', badge: '4,820' },
      { id: 'p-priya', label: 'Priya', icon: 'user', badge: '4,210' },
      { id: 'p-jonas', label: 'Jonas', icon: 'user', badge: '3,980' }
    ] },
    { title: 'Playlists', collapsible: true, items: [
      { id: 'pl-80s', label: '80s Synth Hits', icon: 'playlist' },
      { id: 'pl-euro', label: 'Eurovision Bangers', icon: 'playlist' },
      { id: 'pl-film', label: 'Movie Soundtracks', icon: 'playlist' }
    ] }
  ];

  return { cover: cover, SONGS: SONGS, PLAYERS: PLAYERS, SECTIONS: SECTIONS };
})();
