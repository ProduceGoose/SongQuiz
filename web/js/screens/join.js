/* Join: enter a room code and the name other players will see. */
(function () {
  var h = React.createElement;
  var S = window.SongQuiz;
  var App = window.SQApp;
  var ui = App.ui;

  function Join(props) {
    var app = props.app;
    var code = React.useState('');
    var name = React.useState(app.settings.name);
    var errors = React.useState({});

    function submit(e) {
      e.preventDefault();
      var c = code[0].trim().toUpperCase();
      var n = name[0].trim();
      var next = {};
      if (!/^[A-Z0-9]{4}$/.test(c)) next.code = 'Enter the 4-character code from your host, like KX7Q.';
      if (!n) next.name = 'Enter the name other players will see.';
      errors[1](next);
      if (!next.code && !next.name) app.joinRoom(c, n);
    }

    return h('form', { className: 'app-screen', onSubmit: submit, noValidate: true },
      h(ui.ScreenHeader, { title: 'Join a room', hint: 'Ask the host for the room code. Try KX7Q for the demo room.' }),
      h(ui.Sheet, { title: 'Room details', className: 'app-narrow' },
        h(ui.Field, {
          id: 'join-code', label: 'Room code', icon: 'broadcast', placeholder: 'KX7Q', maxLength: 4, mono: true,
          value: code[0], error: errors[0].code,
          onChange: function (v) { code[1](v.toUpperCase()); errors[1]({}); }
        }),
        h(ui.Field, {
          id: 'join-name', label: 'Your name', icon: 'user', maxLength: 20,
          value: name[0], error: errors[0].name, help: 'Shown in the lobby and on the scoreboard.',
          onChange: function (v) { name[1](v); errors[1]({}); }
        }),
        app.room ? h('p', { className: 'app-help' }, 'Joining another room takes you out of ' + app.room.name + '.') : null,
        h('div', { className: 'app-sheet-actions' },
          h(S.Button, { size: 'lg', onClick: function () { app.go('home'); } }, 'Cancel'),
          h(S.Button, { variant: 'primary', size: 'lg', type: 'submit' }, 'Join room'))));
  }

  App.screens.join = {
    title: 'Join a room',
    component: Join,
    lcd: function () { return { title: 'Join a room', subtitle: 'Waiting for a room code' }; },
    status: function () { return 'Room codes have 4 letters or digits'; }
  };
})();
