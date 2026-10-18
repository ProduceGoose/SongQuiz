// Playlists: browse as covers or as a list, search, and open one for its sample songs.
import { AlbumGrid } from '../components/albums/AlbumGrid';
import { AlbumTile } from '../components/albums/AlbumTile';
import { Badge } from '../components/controls/Badge';
import { Button } from '../components/controls/Button';
import { Icon } from '../components/controls/Icon';
import { ScreenHeader, Section } from '../components/content/Layout';
import { Table, rowLink } from '../components/tables/Table';
import { useEffect, useRef, useState } from 'react';
import { artworkUrl, playlistById, playlists } from '../data/demo';
import { lookupPreviews } from '../game/preview';
import type { Playlist, ScreenDef, ScreenProps, Track } from '../types';
import './Playlists.css';

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

/**
 * Plays the songs' Apple Music previews on the playlist page. The addresses are fetched in one
 * request when the page opens, so a click can start the sound straight away (Safari only allows
 * sound that starts within the click).
 */
function useSongPreviews(tracks: Track[], volume: number) {
  const [urls, setUrls] = useState<Map<number, string>>(new Map());
  const [playing, setPlaying] = useState<number | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let current = true;
    const ids = tracks.flatMap((t) => (t.apple ? [t.apple.id] : []));
    void lookupPreviews(ids).then((found) => { if (current) setUrls(found); });
    return () => {
      current = false;
      audio.current?.pause();
    };
  }, [tracks]);

  useEffect(() => {
    if (audio.current) audio.current.volume = volume / 100;
  }, [volume]);

  function toggle(track: Track) {
    const id = track.apple?.id;
    const url = id ? urls.get(id) : undefined;
    if (!id || !url) return;
    if (!audio.current) {
      audio.current = new Audio();
      audio.current.onended = () => setPlaying(null);
    }
    const a = audio.current;
    if (playing === id) {
      a.pause();
      setPlaying(null);
      return;
    }
    a.src = url;
    a.volume = volume / 100;
    a.play().then(() => setPlaying(id), () => setPlaying(null));
  }

  return { has: (t: Track) => !!t.apple && urls.has(t.apple.id), playing, toggle };
}

function PlaylistDetail({ app, id }: ScreenProps) {
  const p = playlistById(id);
  const previews = useSongPreviews(p.tracks, app.settings.volume);
  // No previews during a round: it would mix with the round's song.
  const canPreview = !app.round;
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
          {p.tracks.map((t, i) => {
            const on = previews.playing === t.apple?.id;
            const cover = artworkUrl(t, 64);
            return (
              <tr key={t.title}>
                <td className="sq-col-rank">
                  {canPreview && previews.has(t) ? (
                    <button
                      type="button" className={on ? 'app-preview-btn is-on' : 'app-preview-btn'} aria-pressed={on}
                      aria-label={(on ? 'Stop preview of ' : 'Play preview of ') + t.title} title={on ? 'Stop' : 'Play preview'}
                      onClick={() => previews.toggle(t)}
                    >
                      <Icon name={on ? 'pause' : 'play'} size={8} />
                    </button>
                  ) : i + 1}
                </td>
                <td>
                  <span className="app-cell-art">
                    {cover ? <img src={cover} alt="" loading="lazy" /> : null}
                    {t.apple ? <a className="app-song-link" href={t.apple.url} target="_blank" rel="noopener noreferrer">{t.title}</a> : t.title}
                  </span>
                </td>
                <td>{t.artist}</td>
                <td className="sq-col-num">{t.year}</td>
              </tr>
            );
          })}
        </Table>
        <p className="app-hint">Previews and covers from <a className="app-apple-link" href="https://music.apple.com" target="_blank" rel="noopener noreferrer">Apple Music</a>.</p>
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
