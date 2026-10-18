/* Profile & settings: display name, theme, volume and album-art preference. */
(function () {
  var h = React.createElement;
  var S = window.SongQuiz;
  var App = window.SQApp;
  var ui = App.ui;

  function Settings(props) {
    var app = props.app;
    var settings = app.settings;
    var name = React.useState(settings.name);
    var error = React.useState(null);

    function saveName(e) {
      e.preventDefault();
      var n = name[0].trim();
      if (!n) { error[1]('Your name can’t be empty.'); return; }
      app.updateSettings({ name: n });
      app.flash('Name saved', 'Other players will see “' + n + '”');
    }

    return h('div', { className: 'app-screen' },
      h(ui.ScreenHeader, { align: 'left', title: 'Profile & settings', hint: 'Saved in this browser only.' }),
      h('div', { className: 'app-columns is-even' },
        h(ui.Sheet, { title: 'Profile' },
          h('form', { className: 'app-stack', onSubmit: saveName, noValidate: true },
            h(ui.Field, {
              id: 'settings-name', label: 'Display name', icon: 'user', maxLength: 20,
              value: name[0], error: error[0], help: 'Shown in lobbies and on the scoreboard.',
              onChange: function (v) { name[1](v); error[1](null); }
            }),
            h('div', { className: 'app-sheet-actions' },
              h(S.Button, { type: 'submit' }, 'Save name')))),

        h(ui.Sheet, { title: 'Sound & display' },
          h(ui.Setting, { label: 'Theme', hint: 'System follows your device.' },
            h(S.SegmentedControl, {
              label: 'Theme', value: settings.theme,
              onChange: function (v) { app.updateSettings({ theme: v }); },
              options: [{ value: 'system', label: 'System' }, { value: 'light', label: 'Aqua' }, { value: 'dark', label: 'Graphite' }]
            })),
          h(ui.Setting, { label: 'Volume', hint: settings.volume + '%' },
            h(S.VolumeSlider, { value: settings.volume, onChange: function (v) { app.updateSettings({ volume: v }); } })),
          h(ui.Setting, { label: 'Album art in rounds', hint: 'Hiding it makes cover rounds harder.' },
            h(S.SegmentedControl, {
              label: 'Album art in rounds', value: settings.covers,
              onChange: function (v) { app.updateSettings({ covers: v }); },
              options: [{ value: 'on', label: 'Show' }, { value: 'off', label: 'Hide' }]
            })),
          h('div', { className: 'app-sheet-actions' },
            h(S.Button, { onClick: app.resetPrototype }, 'Reset prototype')))));
  }

  App.screens.settings = {
    title: 'Profile & settings',
    component: Settings,
    lcd: function (app) { return { title: 'Profile & settings', subtitle: 'Playing as ' + app.settings.name }; },
    status: function () { return 'Settings are saved in this browser'; }
  };
})();
