// The LCD in the app's toolbar. In order of priority: a message flashed by an action (app.flash),
// the round being played or revealed, or the two lines the current screen asks for (ScreenDef.lcd).
import { Icon } from '../controls/Icon';
import { formatTime } from '../utils';
import { LcdDisplay, type LcdDisplayProps } from './LcdDisplay';
import { canHost, votesToSkip } from '../../game/rooms';
import { roundElapsed } from '../../game/preview';
import { effectsText, NO_EFFECTS } from '../../game/effects';
import { fastest } from '../../game/scoring';
import { hearts, PLAYLISTS_PER_LEVEL } from '../../game/survival';
import { ME, type AppApi, type LcdText, type Round, type ScreenDef } from '../../types';

/** " · 1 of 3 votes to skip", once someone has voted. */
function skipVotes(app: AppApi, round: Round): string {
  const votes = round.skipVotes?.length ?? 0;
  if (!votes || !app.room) return '';
  const players = app.online ? app.room.players.filter((p) => p.connected !== false).length : app.room.players.length;
  return ` · ${votes} of ${votesToSkip(players)} votes to skip`;
}

/** How many have named what the round asks for. */
function progress(round: Round, players: number): string {
  switch (round.guess) {
    case 'title': return `${round.solvedTitle.length} of ${players} named the title`;
    case 'artist': return `${round.solvedArtist.length} of ${players} named the artist`;
    case 'both': return `${round.solvedBoth.length} of ${players} named both`;
    default: return `${round.solvedTitle.length} named the title · ${round.solvedArtist.length} named the artist`;
  }
}

export interface AppLcdProps {
  app: AppApi;
  screen: ScreenDef;
  /** A flashed message; shown instead of everything else while set. */
  message: LcdText | null;
}

function roundLcd(app: AppApi, round: Round): LcdDisplayProps {
  if (round.phase === 'spin' && round.run) {
    return { title: `${round.run.level} ${round.run.levelStage} of ${PLAYLISTS_PER_LEVEL} — picking a playlist…`, subtitle: hearts(round.run.lives) };
  }
  if (round.phase === 'playing') {
    const elapsed = Math.min(round.length, roundElapsed(round));
    return {
      title: round.run
        ? `${round.run.level} ${round.run.levelStage} of ${PLAYLISTS_PER_LEVEL} — ${round.run.playlistTitle}`
        : `Round ${round.number} of ${round.total} — ${effectsText(round.effects ?? NO_EFFECTS) || 'Name that tune'}`,
      subtitle: round.pausedAt !== undefined
        ? 'Paused by the host'
        : app.snippet.blocked
        ? 'Click anywhere to hear the song'
        : round.run
        ? `${hearts(round.run.lives)} · song ${round.number}` + (effectsText(round.effects ?? NO_EFFECTS) ? ` · ${effectsText(round.effects ?? NO_EFFECTS)}` : '')
        : progress(round, app.room?.players.length ?? 0) + skipVotes(app, round),
      progress: elapsed / round.length,
      elapsed: Math.floor(elapsed),
      remaining: Math.ceil(round.length - elapsed)
    };
  }
  const first = fastest(round);
  const who = first === undefined ? 'Nobody got it'
    : first === ME ? 'You were fastest'
    : `${app.room?.players.find((p) => p.id === first)?.name ?? 'Someone'} was fastest`;
  // A survival run is over with its last life too.
  const last = round.number >= round.total || round.run?.lives === 0;
  if (round.nextAt === undefined) {
    const host = app.room && canHost(app.room, ME) ? 'press Next round' : 'waiting for the host';
    return { title: `It was “${round.track.title}” by ${round.track.artist}`, subtitle: `${who} · ${last ? 'that was the last round · ' : ''}${host}` };
  }
  const wait = Math.max(0, Math.ceil((round.nextAt - Date.now()) / 1000));
  return {
    title: `It was “${round.track.title}” by ${round.track.artist}`,
    subtitle: round.run?.lives === 0 ? `${who} · no lives left`
      : last ? `${who} · that was the last round`
      : round.run ? `${who} · ${hearts(round.run.lives)} · next song in ${formatTime(wait)}`
      : `${who} · next round in ${formatTime(wait)}`
  };
}

export function AppLcd({ app, screen, message }: AppLcdProps) {
  const { room, round } = app;
  const text = message ?? (round ? roundLcd(app, round) : screen.lcd(app));
  return (
    <LcdDisplay
      {...text}
      start={<Icon name="music" size={14} />}
      end={round?.phase === 'playing'
        ? <Icon name="clock" size={14} />
        : room ? <Icon name="users" size={14} title={`${room.players.length} players in your room`} /> : null}
    />
  );
}
