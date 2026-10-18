// The app's sidebar: navigation between screens, and the playlist up next in your room.
import { playlistById, playlists } from '../../data/demo';
import { isScreenName } from '../../screens';
import type { AppApi, Room } from '../../types';
import { NowPlaying } from './NowPlaying';
import { SourceList, type SourceSection } from './SourceList';

function sections(room: Room | null): SourceSection[] {
  const all: Array<SourceSection | null> = [
    {
      title: 'SongQuiz', items: [
        { id: 'home', label: 'Home', icon: 'music' },
        { id: 'join', label: 'Join a room', icon: 'broadcast' },
        { id: 'create', label: 'Create a room', icon: 'plus' }
      ]
    },
    room ? { title: 'Room', items: [{ id: 'lobby', label: room.name, icon: 'users', badge: room.players.length }] } : null,
    {
      title: 'Library', items: [
        { id: 'playlists', label: 'Playlists', icon: 'playlist', badge: playlists.length },
        { id: 'scores', label: 'Scores', icon: 'trophy' }
      ]
    },
    { title: 'You', items: [{ id: 'settings', label: 'Profile & settings', icon: 'user' }] }
  ];
  return all.filter((s): s is SourceSection => s !== null);
}

export function AppSidebar({ app, selected }: { app: AppApi; selected: string }) {
  const { room } = app;
  const upNext = room ? playlistById(room.playlistId) : null;
  return (
    <>
      <SourceList sections={sections(room)} selected={selected} onSelect={(id) => { if (isScreenName(id)) app.go(id); }} />
      {room && upNext
        ? <NowPlaying label="Up next" art={upNext.art} title={upNext.title} subtitle={`${room.rounds} rounds in ${room.name}`} />
        : <NowPlaying hidden title="Nothing playing" subtitle="Join or create a room" />}
    </>
  );
}
