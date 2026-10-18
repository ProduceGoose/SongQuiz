// Playlists: browse as covers or as a list, search, and open one for its sample songs.
import { AlbumGrid, AlbumTile, Badge, Button, Icon } from '@songquiz/ui';
import { ScreenHeader, Section } from '../components/layout';
import { Table, rowLink } from '../components/Table';
import { playlistById, playlists } from '../data/demo';
import type { Playlist, ScreenDef, ScreenProps } from '../types';

function matches(playlist: Playlist, query: string): boolean {
  const haystack = [playlist.title, playlist.era, playlist.level, ...playlist.tracks.map((t) => `${t.title} ${t.artist}`)];
  return haystack.join(' ').toLowerCase().includes(query);
}

function filtered(query: string): Playlist[] {
  const q = query.trim().toLowerCase();
  return q ? playlists.filter((p) => matches(p, q)) : playlists;
}

function Playlists({ app }: ScreenProps) {
  const list = filtered(app.query);
  const open = (p: Playlist) => () => app.go('playlist', p.id);
  const hint = app.query
    ? `${list.length} ${list.length === 1 ? 'playlist matches' : 'playlists match'} “${app.query}”`
    : `${list.length} playlists to quiz on. Open one to see sample songs.`;

  let body;
  if (!list.length) {
    body = (
      <div className="app-empty">
        <p>No playlist has a title, song or artist matching “{app.query}”.</p>
        <Button onClick={() => app.setQuery('')}>Clear search</Button>
      </div>
    );
  } else if (app.playlistView === 'list') {
    body = (
      <Table caption="Playlists" columns={[{ label: 'Name' }, { label: 'Songs', className: 'sq-col-num' }, { label: 'Era' }, { label: 'Level' }]}>
        {list.map((p) => (
          <tr key={p.id} {...rowLink(open(p))}>
            <td><span className="app-cell-art"><img src={p.art} alt="" />{p.title}</span></td>
            <td className="sq-col-num">{p.songs}</td>
            <td>{p.era}</td>
            <td>{p.level}</td>
          </tr>
        ))}
      </Table>
    );
  } else {
    body = (
      <AlbumGrid label="Playlists">
        {list.map((p) => <AlbumTile key={p.id} art={p.art} title={p.title} subtitle={p.subtitle} onClick={open(p)} />)}
      </AlbumGrid>
    );
  }

  return (
    <div className="app-screen">
      <ScreenHeader align="left" title="Playlists" hint={hint} />
      {body}
    </div>
  );
}

function PlaylistDetail({ app, id }: ScreenProps) {
  const p = playlistById(id);
  return (
    <div className="app-screen">
      <button type="button" className="app-back" onClick={() => app.go('playlists')}>
        <Icon name="disclosure" size={8} />Playlists
      </button>

      <div className="app-detail">
        <img className="app-detail-art" src={p.art} alt={'Cover of ' + p.title} />
        <div className="app-detail-text">
          <h1 className="app-question">{p.title}</h1>
          <p className="app-hint">{p.description}</p>
          <div className="app-meta">
            <Badge>{p.subtitle}</Badge>
            <Badge>{p.era}</Badge>
            <Badge>{p.level}</Badge>
          </div>
          <div className="app-actions">
            <Button variant="primary" icon="plus" onClick={() => app.go('create', p.id)}>Create a room with this playlist</Button>
          </div>
        </div>
      </div>

      <Section title="Sample songs" hint={`${p.tracks.length} of ${p.songs} songs. Players see titles only after each round.`}>
        <Table
          caption={'Sample songs in ' + p.title}
          columns={[{ label: '#', className: 'sq-col-rank' }, { label: 'Title' }, { label: 'Artist' }, { label: 'Year', className: 'sq-col-num' }]}
        >
          {p.tracks.map((t, i) => (
            <tr key={t.title}>
              <td className="sq-col-rank">{i + 1}</td>
              <td>{t.title}</td>
              <td>{t.artist}</td>
              <td className="sq-col-num">{t.year}</td>
            </tr>
          ))}
        </Table>
      </Section>
    </div>
  );
}

export const playlistsScreen: ScreenDef = {
  title: 'Playlists',
  Component: Playlists,
  toolbarViews: true,
  lcd: (app) => app.query
    ? { title: 'Searching playlists', subtitle: `${filtered(app.query).length} results for “${app.query}”` }
    : { title: 'Playlists', subtitle: `${playlists.length} playlists · ${app.playlistView === 'list' ? 'list view' : 'cover view'}` },
  status: (app) => {
    const list = filtered(app.query);
    const songs = list.reduce((n, p) => n + p.songs, 0);
    return `${list.length} playlists, ${songs.toLocaleString('en-US')} songs`;
  }
};

export const playlistScreen: ScreenDef = {
  title: 'Playlist',
  Component: PlaylistDetail,
  parent: 'playlists',
  lcd: (app) => {
    const p = playlistById(app.route.id);
    return { title: p.title, subtitle: `${p.subtitle} · ${p.era} · ${p.level}` };
  },
  status: (app) => {
    const p = playlistById(app.route.id);
    return `${p.songs} songs, ${p.tracks.length} samples shown`;
  }
};
