// Home: create or join a room, and browse popular playlists.
import { AlbumGrid, AlbumTile, Button } from '@songquiz/ui';
import { Notice, ScreenHeader, Section } from '../components/layout';
import { playlists } from '../data/demo';
import type { ScreenDef, ScreenProps } from '../types';

function Home({ app }: ScreenProps) {
  const { room } = app;
  return (
    <div className="app-screen">
      <ScreenHeader title="Ready for a song quiz?" hint="Open a room and share its code, or join friends who already started one.">
        <Button variant="primary" size="lg" icon="plus" onClick={() => app.go('create')}>Create a room</Button>
        <Button size="lg" icon="broadcast" onClick={() => app.go('join')}>Join with a code</Button>
      </ScreenHeader>

      {room ? (
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
  lcd: (app) => ({ title: 'SongQuiz', subtitle: app.room ? `In ${app.room.name} · code ${app.room.code}` : 'Not in a room yet' }),
  status: (app) => `${playlists.length} playlists, ` + (app.room ? `${app.room.players.length} players in your room` : 'not in a room')
};
