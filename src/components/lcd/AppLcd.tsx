// The LCD in the app's toolbar. In order of priority: a message flashed by an action (app.flash),
// the round being played or revealed, or the two lines the current screen asks for (ScreenDef.lcd).
import { Icon } from '../controls/Icon';
import { formatTime } from '../utils';
import { LcdDisplay, type LcdDisplayProps } from './LcdDisplay';
import { ME, type AppApi, type LcdText, type Round, type ScreenDef } from '../../types';

export interface AppLcdProps {
  app: AppApi;
  screen: ScreenDef;
  /** A flashed message; shown instead of everything else while set. */
  message: LcdText | null;
}

function roundLcd(app: AppApi, round: Round): LcdDisplayProps {
  const players = app.room?.players.length ?? 0;
  if (round.phase === 'playing') {
    const elapsed = Math.min(round.length, (Date.now() - round.startedAt) / 1000);
    return {
      title: `Round ${round.number} of ${round.total} — Name that tune`,
      subtitle: `${round.solved.length} of ${players} players guessed it`,
      progress: elapsed / round.length,
      elapsed: Math.floor(elapsed),
      remaining: Math.ceil(round.length - elapsed)
    };
  }
  const fastest = round.solved[0];
  const who = fastest === undefined ? 'Nobody got it'
    : fastest === ME ? 'You were fastest'
    : `${app.room?.players.find((p) => p.id === fastest)?.name ?? 'Someone'} was fastest`;
  const wait = Math.max(0, Math.ceil(((round.nextAt ?? 0) - Date.now()) / 1000));
  return {
    title: `It was “${round.track.title}” by ${round.track.artist}`,
    subtitle: round.number < round.total ? `${who} · next round in ${formatTime(wait)}` : `${who} · that was the last round`
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
