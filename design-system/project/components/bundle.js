/* @ds-bundle: {"format":4,"namespace":"SongQuiz","components":[{"name":"Window"},{"name":"Toolbar"},{"name":"Transport"},{"name":"VolumeSlider"},{"name":"LcdDisplay"},{"name":"SegmentedControl"},{"name":"SearchField"},{"name":"Button"},{"name":"SourceList"},{"name":"AlbumGrid"},{"name":"AlbumTile"},{"name":"NowPlaying"},{"name":"Leaderboard"},{"name":"Badge"},{"name":"StatusBar"},{"name":"Icon"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }

  // Controlled when `value` is given, otherwise keeps its own state.
  function useMaybeControlled(value, initial, onChange) {
    var st = React.useState(initial);
    var cur = value === undefined || value === null ? st[0] : value;
    function set(next) {
      if (value === undefined || value === null) st[1](next);
      if (onChange) onChange(next);
    }
    return [cur, set];
  }

  // ---- Icon -------------------------------------------------------------
  // 16×16 glyphs. 'f' = filled path, 's' = stroked path (optional width).
  var ICONS = {
    play: [['f', 'M5 3.25v9.5L12.75 8z']],
    pause: [['f', 'M4.25 3h2.75v10H4.25zM9 3h2.75v10H9z']],
    prev: [['f', 'M8 4v8L2.25 8zM14 4v8L8.25 8z']],
    next: [['f', 'M2 4v8l5.75-4zM8 4v8l5.75-4z']],
    'volume-low': [['f', 'M2 6h2.5L8 3v10L4.5 10H2z']],
    'volume-high': [['f', 'M1.5 6H4l3.5-3v10L4 10H1.5z'], ['s', 'M10 5.5a3.5 3.5 0 0 1 0 5', 1.4], ['s', 'M12 3.5a6.4 6.4 0 0 1 0 9', 1.4]],
    search: [['s', 'M10.5 6.5a4 4 0 1 1-8 0a4 4 0 1 1 8 0', 1.7], ['s', 'M9.5 9.5l4 4', 2]],
    plus: [['f', 'M7 2.5h2v4.5h4.5v2H9v4.5H7V9H2.5V7H7z']],
    shuffle: [['s', 'M2 4.5h2.2c3.2 0 4.2 7 7.4 7H13', 1.5], ['s', 'M2 11.5h2.2c1.3 0 2.1-1.2 2.8-2.7', 1.5], ['s', 'M9 6.6c.7-1.2 1.4-2.1 2.6-2.1H13', 1.5], ['f', 'M12.5 2.25l3 2.25-3 2.25z'], ['f', 'M12.5 9.25l3 2.25-3 2.25z']],
    repeat: [['s', 'M2.75 9V6.75a2 2 0 0 1 2-2H12', 1.5], ['s', 'M13.25 7v2.25a2 2 0 0 1-2 2H4', 1.5], ['f', 'M11.5 2.25l3 2.5-3 2.5z'], ['f', 'M4.5 8.75l-3 2.5 3 2.5z']],
    music: [['f', 'M6 3.6l7-1.6v8.4a2.1 2.1 0 1 1-1.5-2V4.7L7.5 5.7v6.2a2.1 2.1 0 1 1-1.5-2z']],
    playlist: [['f', 'M1.5 3h9v1.6h-9zM1.5 6.4h9V8h-9zM1.5 9.8h5.5v1.6H1.5z'], ['f', 'M11.5 6.2L15 5.4v1.7l-2 .45v4.6a1.75 1.75 0 1 1-1.5-1.73z']],
    user: [['f', 'M10.75 5.25a2.75 2.75 0 1 1-5.5 0a2.75 2.75 0 1 1 5.5 0'], ['f', 'M2.5 14c0-3 2.4-5 5.5-5s5.5 2 5.5 5z']],
    users: [['f', 'M8.25 5a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 1 1 4.5 0'], ['f', 'M1 13.5c0-2.6 2-4.3 5-4.3s5 1.7 5 4.3z'], ['f', 'M13.5 5.5a2 2 0 1 1-4 0a2 2 0 1 1 4 0'], ['f', 'M12 13.5h3.5c0-2.3-1.5-3.8-3.9-3.9c.9.9 1.4 2.2 1.6 3.9z']],
    trophy: [['f', 'M4.5 2h7v3.5a3.5 3.5 0 0 1-7 0z'], ['s', 'M4.5 3.25H2.5v1a2.25 2.25 0 0 0 2.25 2.25', 1.3], ['s', 'M11.5 3.25h2v1a2.25 2.25 0 0 1-2.25 2.25', 1.3], ['f', 'M7.25 9h1.5v2.5H11V14H5v-2.5h2.25z']],
    check: [['s', 'M3 8.5l3.2 3L13 4.5', 2.2]],
    cross: [['s', 'M4 4l8 8M12 4l-8 8', 2.2]],
    clock: [['s', 'M14 8a6 6 0 1 1-12 0a6 6 0 1 1 12 0', 1.5], ['s', 'M8 4.5V8l2.5 1.5', 1.5]],
    list: [['f', 'M2 3h12v2.25H2zM2 6.9h12v2.25H2zM2 10.75h12V13H2z']],
    grid: [['f', 'M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z']],
    disclosure: [['f', 'M5 3.5l6 4.5-6 4.5z']],
    'disclosure-down': [['f', 'M3.5 5h9L8 11z']],
    broadcast: [['f', 'M9.5 8a1.5 1.5 0 1 1-3 0a1.5 1.5 0 1 1 3 0'], ['s', 'M5.2 5.2a4 4 0 0 0 0 5.6M10.8 5.2a4 4 0 0 1 0 5.6', 1.4], ['s', 'M3.1 3.1a7 7 0 0 0 0 9.8M12.9 3.1a7 7 0 0 1 0 9.8', 1.4]]
  };

  var ICON_NAMES = Object.keys(ICONS);

  function Icon(props) {
    var name = props.name, size = props.size || 16, title = props.title;
    var parts = ICONS[name] || [];
    return h('svg', {
      viewBox: '0 0 16 16', width: size, height: size, focusable: 'false',
      className: cx('sq-icon', props.className),
      role: title ? 'img' : undefined,
      'aria-hidden': title ? undefined : true,
      style: props.style
    },
      title ? h('title', null, title) : null,
      parts.map(function (p, i) {
        return p[0] === 'f'
          ? h('path', { key: i, d: p[1], fill: 'currentColor' })
          : h('path', { key: i, d: p[1], fill: 'none', stroke: 'currentColor', strokeWidth: p[2] || 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' });
      }));
  }

  // ---- Window & Toolbar -------------------------------------------------
  function Window(props) {
    return h('div', { className: cx('sq-window', props.className), style: props.style },
      h('div', { className: 'sq-window-head' },
        h('div', { className: 'sq-titlebar' },
          h('span', { className: 'sq-dots' },
            h('button', { type: 'button', className: 'sq-dot sq-dot-close', 'aria-label': props.closeLabel || 'Leave room', onClick: props.onClose }),
            h('i', { className: 'sq-dot sq-dot-minimize', 'aria-hidden': true }),
            h('i', { className: 'sq-dot sq-dot-zoom', 'aria-hidden': true })),
          h('div', { className: 'sq-title' }, props.title)),
        props.toolbar ? h('div', { className: 'sq-window-toolbar' }, props.toolbar) : null),
      h('div', { className: 'sq-window-main' },
        props.sidebar ? h('aside', { className: 'sq-window-sidebar' }, props.sidebar) : null,
        h('div', { className: 'sq-window-content' }, props.children)),
      props.statusBar || null);
  }

  function Toolbar(props) {
    return h('div', { className: cx('sq-toolbar', props.className) },
      h('div', { className: 'sq-toolbar-start' }, props.start),
      h('div', { className: 'sq-toolbar-center' }, props.center),
      h('div', { className: 'sq-toolbar-end' }, props.end));
  }

  // ---- Playback ---------------------------------------------------------
  var TRANSPORT_LABELS = { play: 'Play', pause: 'Pause', prev: 'Replay snippet', next: 'Skip' };

  function TransportButton(props) {
    var icon = props.icon || 'play', size = props.size || 'md';
    return h('button', {
      type: 'button', disabled: props.disabled, onClick: props.onClick,
      className: cx('sq-transport-btn', 'sq-transport-' + size, props.className),
      'aria-label': props.label || TRANSPORT_LABELS[icon]
    }, h(Icon, { name: icon, size: size === 'lg' ? 18 : 13 }));
  }

  function Transport(props) {
    var playing = !!props.playing;
    return h('div', { className: cx('sq-transport', props.className), role: 'group', 'aria-label': 'Playback' },
      h(TransportButton, { icon: 'prev', onClick: props.onPrevious, disabled: props.disabled }),
      h(TransportButton, { icon: playing ? 'pause' : 'play', size: 'lg', onClick: props.onToggle, disabled: props.disabled }),
      h(TransportButton, { icon: 'next', onClick: props.onNext, disabled: props.disabled }));
  }

  function VolumeSlider(props) {
    var min = props.min == null ? 0 : props.min, max = props.max == null ? 100 : props.max;
    var s = useMaybeControlled(props.value, props.defaultValue == null ? 70 : props.defaultValue, props.onChange);
    var pct = ((s[0] - min) / (max - min)) * 100;
    return h('div', { className: cx('sq-volume', props.className) },
      h(Icon, { name: 'volume-low', size: 12 }),
      h('input', {
        type: 'range', min: min, max: max, value: s[0], className: 'sq-volume-range',
        'aria-label': props.label || 'Volume', disabled: props.disabled,
        style: { '--sq-fill': pct + '%' },
        onChange: function (e) { s[1](Number(e.target.value)); }
      }),
      h(Icon, { name: 'volume-high', size: 12 }));
  }

  function fmtTime(sec) {
    var neg = sec < 0;
    sec = Math.abs(Math.round(sec));
    var m = Math.floor(sec / 60), r = sec % 60;
    return (neg ? '-' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }

  function LcdDisplay(props) {
    var p = props.progress == null ? null : Math.max(0, Math.min(1, props.progress));
    var el = typeof props.elapsed === 'number' ? fmtTime(props.elapsed) : props.elapsed;
    var rem = typeof props.remaining === 'number' ? fmtTime(-Math.abs(props.remaining)) : props.remaining;
    return h('div', { className: cx('sq-lcd', props.className) },
      h('div', { className: 'sq-lcd-side' }, props.start),
      h('div', { className: 'sq-lcd-body' },
        props.title != null ? h('div', { className: 'sq-lcd-title' }, props.title) : null,
        props.subtitle != null ? h('div', { className: 'sq-lcd-subtitle' }, props.subtitle) : null,
        p != null ? h('div', { className: 'sq-lcd-progress' },
          h('span', { className: 'sq-lcd-time sq-lcd-elapsed' }, el),
          h('div', { className: 'sq-lcd-track', role: 'progressbar', 'aria-label': props.progressLabel || 'Snippet progress', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(p * 100) },
            h('div', { className: 'sq-lcd-fill', style: { width: p * 100 + '%' } })),
          h('span', { className: 'sq-lcd-time' }, rem)) : null),
      h('div', { className: 'sq-lcd-side' }, props.end));
  }

  // ---- Navigation & input ----------------------------------------------
  function SegmentedControl(props) {
    var opts = (props.options || []).map(function (o) { return typeof o === 'string' ? { value: o, label: o } : o; });
    var s = useMaybeControlled(props.value, props.defaultValue != null ? props.defaultValue : opts[0] && opts[0].value, props.onChange);
    return h('div', { className: cx('sq-segmented', props.className), role: 'radiogroup', 'aria-label': props.label },
      opts.map(function (o) {
        var on = o.value === s[0];
        return h('button', {
          key: o.value, type: 'button', role: 'radio', 'aria-checked': on,
          'aria-label': o.label ? undefined : o.title || o.value, title: o.label ? undefined : o.title || o.value,
          className: cx('sq-seg', on && 'is-on', !o.label && 'sq-seg-icon'),
          onClick: function () { s[1](o.value); }
        }, o.icon ? h(Icon, { name: o.icon, size: 12 }) : null, o.label ? h('span', null, o.label) : null);
      }));
  }

  function SearchField(props) {
    var size = props.size || 'md';
    var s = useMaybeControlled(props.value, props.defaultValue || '', props.onChange);
    return h('form', {
      className: cx('sq-search', 'sq-search-' + size, props.className), role: 'search',
      onSubmit: function (e) { e.preventDefault(); if (props.onSubmit) props.onSubmit(s[0]); }
    },
      h(Icon, { name: props.icon || 'search', size: size === 'lg' ? 16 : 12 }),
      h('input', {
        type: 'text', value: s[0], placeholder: props.placeholder == null ? 'Search' : props.placeholder,
        'aria-label': props.label || props.placeholder || 'Search', autoComplete: 'off', spellCheck: false,
        disabled: props.disabled, autoFocus: props.autoFocus,
        onChange: function (e) { s[1](e.target.value); }
      }),
      s[0] && !props.disabled ? h('button', { type: 'button', className: 'sq-search-clear', 'aria-label': 'Clear', onClick: function () { s[1](''); } }, h(Icon, { name: 'cross', size: 8 })) : null);
  }

  function Button(props) {
    var variant = props.variant || 'default', size = props.size || 'md';
    return h('button', {
      type: props.type || 'button', disabled: props.disabled, onClick: props.onClick, title: props.title,
      className: cx('sq-btn', 'sq-btn-' + variant, 'sq-btn-' + size, props.className)
    }, props.icon ? h(Icon, { name: props.icon, size: size === 'lg' ? 14 : 12 }) : null, props.children != null ? h('span', null, props.children) : null);
  }

  function SourceList(props) {
    var closed = React.useState({});
    return h('nav', { className: cx('sq-source', props.className), 'aria-label': props.label || 'Sidebar' },
      (props.sections || []).map(function (sec, si) {
        var key = sec.title || String(si);
        var isClosed = closed[0][key] != null ? closed[0][key] : !!sec.collapsed;
        function toggle() { var n = Object.assign({}, closed[0]); n[key] = !isClosed; closed[1](n); }
        var heading = sec.title == null ? null : sec.collapsible
          ? h('button', { type: 'button', className: 'sq-source-heading', 'aria-expanded': !isClosed, onClick: toggle }, h(Icon, { name: isClosed ? 'disclosure' : 'disclosure-down', size: 8 }), sec.title)
          : h('div', { className: 'sq-source-heading' }, sec.title);
        return h('div', { key: key, className: 'sq-source-section' },
          heading,
          isClosed ? null : h('ul', { className: 'sq-source-items' },
            (sec.items || []).map(function (it) {
              var on = it.id === props.selected;
              return h('li', { key: it.id },
                h('button', {
                  type: 'button', className: cx('sq-source-item', on && 'is-on'), 'aria-current': on ? 'true' : undefined,
                  onClick: function () { if (props.onSelect) props.onSelect(it.id); }
                },
                  it.icon ? h(Icon, { name: it.icon, size: 16 }) : null,
                  h('span', { className: 'sq-source-label' }, it.label),
                  it.badge != null ? h('span', { className: 'sq-count' }, it.badge) : null));
            })));
      }));
  }

  // ---- Answers ----------------------------------------------------------
  function Sleeve(props) {
    return props.hidden
      ? h('span', { className: 'sq-sleeve sq-sleeve-hidden', 'aria-hidden': true }, '?')
      : h('span', { className: 'sq-sleeve', 'aria-hidden': true });
  }

  function AlbumGrid(props) {
    return h('div', { className: cx('sq-grid', props.className), role: 'list', 'aria-label': props.label, style: props.size ? { '--sq-art': props.size + 'px' } : undefined },
      React.Children.map(props.children, function (c) { return c ? h('div', { role: 'listitem', className: 'sq-grid-cell' }, c) : null; }));
  }

  var STATE_BADGE = { correct: ['correct', 'Correct'], wrong: ['wrong', 'Wrong'] };

  function AlbumTile(props) {
    var state = props.state || 'idle';
    var hidden = state === 'hidden';
    var Tag = props.onClick ? 'button' : 'div';
    var b = STATE_BADGE[state];
    return h(Tag, {
      type: props.onClick ? 'button' : undefined, onClick: props.onClick, disabled: props.onClick ? props.disabled : undefined,
      'aria-pressed': props.onClick ? state === 'selected' : undefined,
      className: cx('sq-tile', 'is-' + state, props.className),
      style: props.size ? { '--sq-art': props.size + 'px' } : undefined
    },
      h('span', { className: 'sq-tile-art' },
        hidden || !props.art ? h(Sleeve, { hidden: hidden }) : h('img', { src: props.art, alt: '', loading: 'lazy' }),
        b ? h('span', { className: 'sq-tile-badge' }, h(Badge, { tone: b[0] }, props.badgeLabel || b[1])) : null),
      h('span', { className: 'sq-tile-title' },
        props.playing ? h(Icon, { name: 'volume-high', size: 10, title: 'Playing' }) : null,
        h('span', { className: 'sq-ellipsis' }, props.title)),
      props.subtitle != null ? h('span', { className: 'sq-tile-subtitle sq-ellipsis' }, props.subtitle) : null);
  }

  function NowPlaying(props) {
    return h('section', { className: cx('sq-nowplaying', props.className), 'aria-label': props.label || 'Now Playing' },
      h('div', { className: 'sq-nowplaying-head' }, h(Icon, { name: 'play', size: 8 }), props.label || 'Now Playing'),
      h('div', { className: 'sq-nowplaying-art' },
        props.hidden || !props.art ? h(Sleeve, { hidden: props.hidden }) : h('img', { src: props.art, alt: props.title ? 'Cover of ' + props.title : '' })),
      props.title || props.subtitle ? h('div', { className: 'sq-nowplaying-caption' },
        props.title ? h('div', { className: 'sq-nowplaying-title sq-ellipsis' }, props.title) : null,
        props.subtitle ? h('div', { className: 'sq-nowplaying-subtitle sq-ellipsis' }, props.subtitle) : null) : null);
  }

  // ---- Scores & status --------------------------------------------------
  var BADGE_ICON = { correct: 'check', wrong: 'cross', gold: 'trophy' };

  function Badge(props) {
    var tone = props.tone || 'neutral';
    var icon = props.icon === undefined ? BADGE_ICON[tone] : props.icon;
    return h('span', { className: cx('sq-badge', 'sq-badge-' + tone, props.className) },
      icon ? h(Icon, { name: icon, size: 9 }) : null, props.children);
  }

  var PLAYER_STATUS = {
    guessing: ['neutral', 'Guessing'],
    locked: ['aqua', 'Locked in'],
    correct: ['correct', 'Correct'],
    wrong: ['wrong', 'Wrong'],
    away: ['neutral', 'Away']
  };

  function Leaderboard(props) {
    var players = (props.players || []).slice();
    if (props.sort !== false) players.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
    var nf = new Intl.NumberFormat(props.locale || 'en-US');
    return h('table', { className: cx('sq-list', props.className) },
      props.caption ? h('caption', { className: 'sq-visually-hidden' }, props.caption) : null,
      h('thead', null, h('tr', null,
        h('th', { scope: 'col', className: 'sq-col-rank' }, '#'),
        h('th', { scope: 'col' }, 'Player'),
        h('th', { scope: 'col', className: 'sq-col-status' }, 'Status'),
        h('th', { scope: 'col', className: 'sq-col-num' }, 'Streak'),
        h('th', { scope: 'col', className: 'sq-col-num is-sorted', 'aria-sort': props.sort === false ? undefined : 'descending' }, 'Score'))),
      h('tbody', null, players.map(function (p, i) {
        var st = PLAYER_STATUS[p.status];
        return h('tr', { key: p.id, className: p.id === props.highlight ? 'is-on' : undefined },
          h('td', { className: 'sq-col-rank' }, i === 0 && p.score > 0 ? h(Badge, { tone: 'gold' }, '1') : i + 1),
          h('td', { className: 'sq-col-name' }, p.name, p.note ? h('span', { className: 'sq-list-note' }, ' ' + p.note) : null),
          h('td', { className: 'sq-col-status' }, st ? h(Badge, { tone: st[0] }, st[1]) : null),
          h('td', { className: 'sq-col-num' }, p.streak ? p.streak + '×' : '–'),
          h('td', { className: 'sq-col-num' },
            p.delta ? h('span', { className: 'sq-delta' }, '+' + nf.format(p.delta)) : null,
            nf.format(p.score || 0)));
      })));
  }

  function BarButton(props) {
    return h('button', {
      type: 'button', onClick: props.onClick, disabled: props.disabled,
      'aria-label': props.label, title: props.label,
      'aria-pressed': props.active == null ? undefined : !!props.active,
      className: cx('sq-barbtn', props.active && 'is-on', props.className)
    }, h(Icon, { name: props.icon, size: 12 }));
  }

  function StatusBar(props) {
    return h('div', { className: cx('sq-statusbar', props.className) },
      h('div', { className: 'sq-statusbar-start' }, props.start),
      h('div', { className: 'sq-statusbar-text', 'aria-live': 'polite' }, props.children),
      h('div', { className: 'sq-statusbar-end' }, props.end));
  }

  var C = window;
  C.SongQuiz = C.SongQuiz || {};
  Object.assign(C.SongQuiz, {
    Window: Window, Toolbar: Toolbar, Transport: Transport, TransportButton: TransportButton,
    VolumeSlider: VolumeSlider, LcdDisplay: LcdDisplay, SegmentedControl: SegmentedControl,
    SearchField: SearchField, Button: Button, SourceList: SourceList, AlbumGrid: AlbumGrid,
    AlbumTile: AlbumTile, NowPlaying: NowPlaying, Leaderboard: Leaderboard, Badge: Badge,
    StatusBar: StatusBar, BarButton: BarButton, Icon: Icon, iconNames: ICON_NAMES, formatTime: fmtTime
  });
})();
