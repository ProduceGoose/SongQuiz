# SongQuiz website (menu prototype)

A clickable prototype of the SongQuiz menus: home, join a room, create a room, lobby,
playlists, scores and settings. Gameplay is not built yet; all rooms, players and scores
are example data from `js/data.js`.

## Run it

Open `index.html` in a browser. No build step or server is needed. You can also serve the
folder (for example `npx http-server web`) and open a screen directly with a hash, such as
`index.html#playlists`.

## Structure

```
web/
  index.html            page skeleton; loads the CSS and scripts in order
  css/style.css         layout and screen styles for this site
  js/data.js            example playlists, rooms and past games
  js/ui.js              small shared pieces (ScreenHeader, Sheet, Field, Table, …)
  js/screens/*.js       one file per screen; each registers itself on SQApp.screens
  js/app.js             the window shell, navigation and app state
  vendor/react/         React 18.3.1
  vendor/songquiz/      the design system (tokens.css, bundle.css, bundle.js)
```

Each screen file exports `{ title, component, lcd(app), status(app) }`: the component
renders the content area, and `lcd` / `status` fill the LCD and the status bar.

## Updating the design system

`vendor/songquiz/` is generated. After changing anything in `design-system/project/`, run:

```
node scripts/sync-design-system.mjs
```
