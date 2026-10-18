/* GameScreen page: a round in progress, composed only from the kit. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;
  var demo = window.SQDemo;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  function Toolbar() {
    return h(S.Toolbar, {
      start: h(React.Fragment, null, h(S.Transport, { playing: true }), h(S.VolumeSlider, {})),
      center: h(S.LcdDisplay, {
        title: 'Round 3 of 10 — Name that tune', subtitle: '5 of 8 players locked in',
        progress: 0.4, elapsed: 12, remaining: 18,
        start: h(S.Icon, { name: 'music', size: 14 }),
        end: h(S.Icon, { name: 'clock', size: 14 })
      }),
      end: h(React.Fragment, null,
        h(S.SegmentedControl, { label: 'Section', options: ['Round', 'Scores', 'History'] }),
        h(S.SearchField, { placeholder: 'Search songs' }))
    });
  }

  function Sidebar() {
    return h(React.Fragment, null,
      h(S.SourceList, { sections: demo.SECTIONS, selected: 'round' }),
      h(S.NowPlaying, { hidden: true, title: 'Mystery track', subtitle: 'Revealed when time runs out' }));
  }

  function Status() {
    var start = h(React.Fragment, null,
      h(S.BarButton, { icon: 'plus', label: 'Invite friends' }),
      h(S.BarButton, { icon: 'shuffle', label: 'Shuffle playlist' }),
      h(S.BarButton, { icon: 'repeat', label: 'Play again', active: true }));
    return h(S.StatusBar, { start: start, end: h(S.BarButton, { icon: 'users', label: 'Players' }) },
      '8 players, round 3 of 10, 0:18 left');
  }

  function Game() {
    var pick = React.useState(1);
    var answer = React.useState('');
    var choices = demo.SONGS.slice(0, 6);

    return h(S.Window, {
      title: 'SongQuiz — Friday Night Room', style: { height: 592 },
      toolbar: h(Toolbar), sidebar: h(Sidebar), statusBar: h(Status)
    },
      h('div', { className: 'prompt' },
        h('div', { className: 'question' }, 'Which song is playing?'),
        h('div', { className: 'hint' }, 'Pick a cover or type your answer. Faster answers score more.'),
        h('div', { className: 'answer' },
          h(S.SearchField, { size: 'lg', icon: 'music', placeholder: 'Type the song or artist…', label: 'Your answer', value: answer[0], onChange: answer[1] }),
          h(S.Button, { variant: 'primary', size: 'lg' }, 'Lock in'))),
      h(S.AlbumGrid, { label: 'Answer choices', size: 112 }, choices.map(function (song, i) {
        return h(S.AlbumTile, {
          key: i, art: demo.cover(i), title: song.title, subtitle: song.artist,
          state: pick[0] === i ? 'selected' : 'idle',
          onClick: function () { pick[1](i); }
        });
      })));
  }

  mount('root', h(Game));
})();
