// Scores: the standings of the game in your room (live while a round is on, then the final
// scores), and the room's session: games won and points since it was opened.
import { Badge } from '../components/controls/Badge';
import { Leaderboard, type LeaderboardPlayer, type PlayerStatus } from '../components/tables/Leaderboard';
import { ScreenHeader, Section } from '../components/content/Layout';
import { Table } from '../components/tables/Table';
import { Button } from '../components/controls/Button';
import { Icon } from '../components/controls/Icon';
import { canHost, waitsForHost } from '../game/rooms';
import { gameResult, GUESS_RULES, hasSolved, pointsText, roundPoints } from '../game/scoring';
import { bestRun, hearts, PLAYLISTS_PER_LEVEL, runText } from '../game/survival';
import { ME, type AppApi, type Round, type RunResult, type ScreenDef, type ScreenProps } from '../types';
import { RoomSettings } from './RoomForm';

function roundStatus(round: Round, id: string): PlayerStatus {
  if (hasSolved(round, id)) return 'correct';
  const title = round.solvedTitle.includes(id), artist = round.solvedArtist.includes(id);
  if (title) return 'title';
  if (artist) return 'artist';
  return round.phase === 'reveal' ? 'wrong' : 'guessing';
}

/** The players in your room with their points; during a round, what they named and won in it. */
function standings(app: AppApi): LeaderboardPlayer[] {
  const { room, round, scores } = app;
  return (room?.players ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    note: p.id === ME ? '(you)' : undefined,
    score: scores?.[p.id] ?? 0,
    delta: round ? roundPoints(round, p.id) : undefined,
    status: p.connected === false ? 'away' : round ? roundStatus(round, p.id) : undefined
  }));
}

/** For hosts while the room waits for them: the next round, or the result after the last. */
export function NextRoundButton({ app }: { app: AppApi }) {
  const { room, round } = app;
  if (!room || !round || !waitsForHost(round) || !canHost(room, ME)) return null;
  return (
    <Button variant="primary" size="lg" icon="play" onClick={app.nextRound}>
      {round.number < round.total ? 'Next round' : 'Show the result'}
    </Button>
  );
}

const END_WARNING = 'Are you sure you want to end the game? All gathered points get lost.';

/** For hosts during a game: ends it after asking. */
export function EndGameButton({ app }: { app: AppApi }) {
  const { room, round } = app;
  if (!room || !round || !canHost(room, ME)) return null;
  return <Button size="lg" icon="cross" onClick={() => { if (window.confirm(END_WARNING)) app.endGame(); }}>End game</Button>;
}

function GameStandings({ app }: { app: AppApi }) {
  const { room, round } = app;
  const title = round?.run ? `${round.run.level} ${round.run.levelStage} of ${PLAYLISTS_PER_LEVEL} · song ${round.number} · ${hearts(round.run.lives)}`
    : round ? `Round ${round.number} of ${round.total}` : 'Final scores';
  const actions = round ? <div className="app-actions"><EndGameButton app={app} /><NextRoundButton app={app} /></div> : null;
  return (
    <Section action={actions} title={title} hint={round ? `${room!.name} · ${GUESS_RULES[round.guess]}` : `${room!.name} · ${room!.rounds} rounds`}>
      <div className="app-table">
        <Leaderboard players={standings(app)} highlight={ME} caption={'Scores in ' + room!.name} />
      </div>
    </Section>
  );
}

/** The end of a survival run: how far it got, and the way to the next one. */
function RunOver({ app, run }: { app: AppApi; run: RunResult }) {
  const best = bestRun();
  const title = run.outcome === 'cleared' ? 'You made it!' : 'Out of lives';
  const how = run.outcome === 'cleared'
    ? `Through all three levels with ${pointsText(run.points)}.`
    : `${runText(run)}, ${pointsText(run.points)}.`;
  const record = run.best ? 'A new best run!'
    : best ? `Your best: ${runText(best)}, ${pointsText(best.points)}.` : '';
  return (
    <ScreenHeader title={<><Icon name="trophy" size={24} /> {title}</>} hint={`${how} ${record}`}>
      <Button variant="primary" size="lg" icon="play" onClick={app.startGame}>Try again</Button>
      <Button size="lg" onClick={() => app.go('solo')}>Other modes</Button>
    </ScreenHeader>
  );
}

/** The end of the game: who won, and the way to the next one. */
function GameOver({ app }: { app: AppApi }) {
  const room = app.room!;
  if (app.run && room.mode === 'survival') return <RunOver app={app} run={app.run} />;
  const players = room.players.map((p) => ({ id: p.id, name: p.id === ME ? 'You' : p.name }));
  const { winners, text } = gameResult(app.scores!, players);
  const title = !winners.length ? 'Game over' : winners.length > 1 ? 'It’s a tie!' : winners[0]!.id === ME ? 'You won!' : `${winners[0]!.name} won!`;
  return (
    <ScreenHeader title={<><Icon name="trophy" size={24} /> {title}</>} hint={`${text} Thanks for playing ${room.name}.`}>
      {canHost(room, ME) ? <Button variant="primary" size="lg" icon="play" onClick={app.startGame}>Play again</Button> : null}
      <Button size="lg" onClick={() => app.go('lobby')}>Back to the lobby</Button>
    </ScreenHeader>
  );
}

/** The room's players by games won, then points, since the room was opened. */
function SessionStandings({ app }: { app: AppApi }) {
  const room = app.room!;
  const session = app.session!;
  const rows = room.players
    .map((p) => ({ ...p, ...(session.players[p.id] ?? { wins: 0, points: 0 }) }))
    .sort((a, b) => b.wins - a.wins || b.points - a.points);
  const isHost = canHost(room, ME);
  const hint = session.games
    ? `${session.games} ${session.games === 1 ? 'game' : 'games'} since ${room.name} opened.`
    : `No games finished since ${room.name} opened. Wins and points add up here after each game.`;
  return (
    <Section
      title="This session" hint={isHost ? hint : `${hint} Only the host can reset them.`}
      action={isHost ? <Button disabled={!session.games} onClick={app.resetSession}>Reset scores</Button> : null}
    >
      <Table
        caption={'Session scores in ' + room.name}
        columns={[{ label: '#', className: 'sq-col-rank' }, { label: 'Player' }, { label: 'Wins', className: 'sq-col-num' }, { label: 'Points', className: 'sq-col-num' }]}
      >
        {rows.map((p, i) => (
          <tr key={p.id} className={p.id === ME ? 'is-on' : undefined}>
            <td className="sq-col-rank">{i === 0 && (p.wins || p.points) ? <Badge tone="gold">1</Badge> : i + 1}</td>
            <td>{p.name}{p.id === ME ? <span className="sq-list-note"> (you)</span> : null}</td>
            <td className="sq-col-num">{p.wins}</td>
            <td className="sq-col-num">{p.points}</td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}

function NoRoom({ app }: { app: AppApi }) {
  return (
    <ScreenHeader title="No scores yet" hint="Scores belong to a room. Create one or join with a code, and every game you play there adds up here.">
      <Button variant="primary" size="lg" icon="plus" onClick={() => app.go('create')}>Create a room</Button>
      <Button size="lg" icon="broadcast" onClick={() => app.go('join')}>Join with a code</Button>
    </ScreenHeader>
  );
}

function Scores({ app }: ScreenProps) {
  if (!app.room || !app.session) return <div className="app-screen"><NoRoom app={app} /></div>;
  const gameOn = !!app.scores;
  return (
    <div className="app-screen">
      {gameOn && !app.round ? <GameOver app={app} /> : (
        <ScreenHeader
          align="left" title="Scores"
          hint={gameOn ? 'The game in your room, then the totals since the room opened.' : 'Wins and points since the room opened. The first game’s scores show up here when it starts.'}
        />
      )}
      {gameOn ? <GameStandings app={app} /> : null}
      <SessionStandings app={app} />
      {gameOn && !app.round && canHost(app.room, ME) ? <RoomSettings app={app} /> : null}
    </div>
  );
}

const myPoints = (app: AppApi) => pointsText(app.scores?.[ME] ?? 0);

function sessionText(app: AppApi): string {
  const wins = app.session?.players[ME]?.wins ?? 0;
  const games = app.session?.games ?? 0;
  return `You won ${wins} of ${games} ${games === 1 ? 'game' : 'games'} this session`;
}

export const scoresScreen: ScreenDef = {
  title: 'Scores',
  Component: Scores,
  lcd: (app) => {
    if (!app.room) return { title: 'Scores', subtitle: 'Join a room to keep score' };
    return { title: 'Scores · ' + app.room.name, subtitle: app.scores ? `You have ${myPoints(app)} · ${sessionText(app)}` : sessionText(app) };
  },
  status: (app) => (app.room ? sessionText(app) : 'Not in a room')
};
