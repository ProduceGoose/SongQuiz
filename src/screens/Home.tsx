// Home: create or join a room, play solo, and browse popular playlists.
import { AlbumGrid } from '../components/albums/AlbumGrid';
import { AlbumTile } from '../components/albums/AlbumTile';
import { Button } from '../components/controls/Button';
import { Notice, ScreenHeader, Section } from '../components/content/Layout';
import { isSolo, playlists } from '../data/demo';
import type { ScreenDef, ScreenProps } from '../types';

function Home({ app }: ScreenProps) {
  const { room } = app;
  return (
    <div className="app-screen">
      <ScreenHeader title="Ready for a song quiz?" hint="Open a room and share its code, join friends who already started one, or play on your own.">
        <Button variant="primary" size="lg" icon="plus" onClick={() => app.go('create')}>Create a room</Button>
        <Button size="lg" icon="broadcast" onClick={() => app.go('join')}>Join with a code</Button>
        <Button size="lg" icon="play" onClick={() => app.go('solo')}>Play solo</Button>
      </ScreenHeader>

      {room && isSolo(room) ? (
        <Notice>
          You’re playing {room.mode === 'survival' ? 'a survival run' : 'solo'}.{' '}
          <button type="button" className="app-link" onClick={() => app.go('lobby')}>Back to your game</button>
        </Notice>
      ) : room ? (
        <Notice>
          You’re in <strong>{room.name}</strong> with {room.players.length - 1} others.{' '}
          <button type="button" className="app-link" onClick={() => app.go('lobby')}>Back to the lobby</button>
        </Notice>
      ) : null}

      <Section
        title="Popular playlists"
        hint="Open one to see sample songs, or start a room with it."
        action={<Button onClick={() => app.go('playlists')}>See all</Button>}
      >
        <AlbumGrid label="Popular playlists">
          {playlists.slice(0, 6).map((p) => (
            <AlbumTile key={p.id} art={p.art} title={p.title} subtitle={p.subtitle} onClick={() => app.go('playlist', p.id)} />
          ))}
        </AlbumGrid>
      </Section>
    </div>
  );
}

export const homeScreen: ScreenDef = {
  title: 'Home',
  Component: Home,
  lcd: (app) => ({
    title: 'iQuiz',
    subtitle: isSolo(app.room) ? 'Playing solo' : app.room ? `In ${app.room.name} · code ${app.room.code}` : 'Not in a room yet'
  }),
  status: (app) => `${playlists.length} playlists, ` + (app.room ? `${app.room.players.length} players in your room` : 'not in a room')
};
