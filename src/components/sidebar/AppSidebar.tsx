// The app's sidebar: navigation between screens, and the playlist up next in your room.
import { artworkUrl, playlistById, playlists } from '../../data/demo';
import { isScreenName } from '../../screens';
import type { AppApi, Room, Round } from '../../types';
import { roundElapsed } from '../../game/preview';
import { NowPlaying } from './NowPlaying';
import { SourceList, type SourceSection } from './SourceList';
import './Countdown.css';

/** The countdown over the cover starts this many seconds before the round ends. */
const COUNTDOWN_SECONDS = 3;

/** The seconds left in the round, from COUNTDOWN_SECONDS down; null before that. */
function Countdown({ round }: { round: Round }) {
  const left = Math.ceil(round.length - roundElapsed(round));
  if (left > COUNTDOWN_SECONDS || left < 1) return null;
  // The key restarts the pulse each second.
  return <span key={left} className="app-countdown" role="timer" aria-label={`${left} seconds left`}>{left}</span>;
}

function sections(room: Room | null): SourceSection[] {
  const all: Array<SourceSection | null> = [
    {
      title: 'iQuiz', items: [
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
  const { room, round } = app;
  const upNext = room ? playlistById(room.playlistId) : null;
  return (
    <>
      <SourceList sections={sections(room)} selected={selected} onSelect={(id) => { if (isScreenName(id)) app.go(id); }} />
      {round?.phase === 'vote'
        ? <NowPlaying hidden title="Voting for a playlist…" subtitle={`${round.total} rounds`} />
        : round?.phase === 'spin'
        ? <NowPlaying hidden title="Picking a playlist…" subtitle={round.run ? `${round.run.level} songs` : ''} />
        : round?.phase === 'playing'
        ? <NowPlaying hidden title={`Round ${round.number} of ${round.total}`} subtitle="Mystery track" overlay={<Countdown round={round} />} />
        : round?.phase === 'reveal'
        ? (
          <NowPlaying
            label="Last song" art={artworkUrl(round.track, 360) ?? round.art} title={round.track.title}
            subtitle={round.years ? `${round.track.artist} · ${round.track.year}` : round.track.artist}
          >
            {round.track.apple ? <a href={round.track.apple.url} target="_blank" rel="noopener noreferrer">Listen on Apple Music</a> : null}
          </NowPlaying>
        )
        : room && upNext
        ? <NowPlaying label="Up next" art={upNext.art} title={upNext.title} subtitle={`${room.rounds} rounds in ${room.name}`} />
        : <NowPlaying hidden title="Nothing playing" subtitle="Join or create a room" />}
    </>
  );
}
