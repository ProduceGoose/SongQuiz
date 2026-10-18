/* Small app-level building blocks shared by the screens. The jukebox components
   themselves (Window, Button, AlbumGrid, …) come from the design system on window.SongQuiz. */
(function () {
  var h = React.createElement;
  var S = window.SongQuiz;
  var App = (window.SQApp = window.SQApp || {});
  App.screens = App.screens || {};

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }

  // Big prompt at the top of a screen, with optional action buttons as children.
  function ScreenHeader(props) {
    return h('header', { className: cx('app-screen-header', props.align === 'left' && 'is-left') },
      h('h1', { className: 'app-question' }, props.title),
      props.hint ? h('p', { className: 'app-hint' }, props.hint) : null,
      props.children ? h('div', { className: 'app-actions' }, props.children) : null);
  }

  // A titled block on the dark content area.
  function Section(props) {
    return h('section', { className: 'app-section' },
      h('div', { className: 'app-section-head' },
        h('div', null,
          h('h2', { className: 'app-section-title' }, props.title),
          props.hint ? h('p', { className: 'app-hint' }, props.hint) : null),
        props.action || null),
      props.children);
  }

  // Silver preference panel, like a settings window, for forms.
  function Sheet(props) {
    return h('section', { className: cx('app-sheet', props.className) },
      props.title ? h('h2', { className: 'app-sheet-title' }, props.title) : null,
      h('div', { className: 'app-sheet-body' }, props.children));
  }

  // Labelled pill text field in the style of the design system's SearchField.
  function Field(props) {
    var errorId = props.id + '-error';
    var helpId = props.id + '-help';
    return h('div', { className: cx('app-field', props.error && 'is-invalid') },
      h('label', { className: 'app-label', htmlFor: props.id }, props.label),
      h('div', { className: 'sq-search sq-search-lg' },
        props.icon ? h(S.Icon, { name: props.icon, size: 16 }) : null,
        h('input', {
          id: props.id, type: 'text', value: props.value, placeholder: props.placeholder,
          maxLength: props.maxLength, autoComplete: 'off', spellCheck: false,
          className: props.mono ? 'app-input-code' : undefined,
          'aria-invalid': props.error ? true : undefined,
          'aria-describedby': props.error ? errorId : props.help ? helpId : undefined,
          onChange: function (e) { props.onChange(e.target.value); }
        })),
      props.error
        ? h('p', { className: 'app-error', id: errorId }, h(S.Icon, { name: 'cross', size: 9 }), props.error)
        : props.help ? h('p', { className: 'app-help', id: helpId }, props.help) : null);
  }

  // One row of a Sheet: a label (and hint) on the left, a control on the right.
  function Setting(props) {
    return h('div', { className: 'app-setting' },
      h('div', { className: 'app-setting-text' },
        h('span', { className: 'app-label' }, props.label),
        props.hint ? h('span', { className: 'app-help' }, props.hint) : null),
      h('div', { className: 'app-setting-control' }, props.children));
  }

  // LCD-style message box.
  function Notice(props) {
    return h('p', { className: 'app-notice', role: 'status' }, props.children);
  }

  // Makes a table row open something on click, Enter or Space.
  function rowLink(onOpen, selected) {
    return {
      className: cx('app-row-link', selected && 'is-on'),
      tabIndex: 0,
      onClick: onOpen,
      onKeyDown: function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); }
      }
    };
  }

  // A design-system list table in a scroll container, so it never widens the page.
  function Table(props) {
    return h('div', { className: 'app-table' },
      h('table', { className: 'sq-list' },
        props.caption ? h('caption', { className: 'sq-visually-hidden' }, props.caption) : null,
        h('thead', null, h('tr', null, props.columns.map(function (c) {
          return h('th', { key: c.label, scope: 'col', className: c.className }, c.label);
        }))),
        h('tbody', null, props.children)));
  }

  App.ui = {
    cx: cx, ScreenHeader: ScreenHeader, Section: Section, Sheet: Sheet, Field: Field,
    Setting: Setting, Notice: Notice, Table: Table, rowLink: rowLink
  };
})();
