/* Icon preview: every glyph with its name. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  mount('root', h(React.Fragment, null, S.iconNames.map(function (name) {
    return h('div', { key: name, className: 'icon' }, h(S.Icon, { name: name }), name);
  })));
})();
