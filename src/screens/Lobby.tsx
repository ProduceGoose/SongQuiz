// Lobby: the room code to share, who is in the room and who is ready.
import { Badge } from '../components/controls/Badge';
import { Button } from '../components/controls/Button';
import { Notice, ScreenHeader, Section } from '../components/content/Layout';
import { Table } from '../components/tables/Table';
import { playlistById } from '../data/demo';
import { ME, type AppApi, type Room, type ScreenDef, type ScreenProps } from '../types';
import { canHost, canVoteSkip, GUESS_LABELS, SKIP_COMMAND, waitsForHost } from '../game/rooms';
import { GUESS_RULES } from '../game/scoring';
import { RoomSettings } from './RoomForm';
import { EndGameButton, NextRoundButton } from './Scores';
import './Lobby.css';

const readyCount = (room: Room) => room.players.filter((p) => p.ready).length;

function NoRoom({ app }: { app: AppApi }) {
  return (
    <div className="app-screen">
      <ScreenHeader title="You’re not in a room" hint="Create a room for your friends, or join one with a code.">
        <Button variant="primary" size="lg" icon="plus" onClick={() => app.go('create')}>Create a room</Button>
        <Button size="lg" icon="broadcast" onClick={() => app.go('join')}>Join with a code</Button>
      </ScreenHeader>
    </div>
  );
}

function Connecting({ app, code }: { app: AppApi; code: string }) {
  return (
    <div className="app-screen">
      <ScreenHeader title={`Joining room ${code}…`} hint="Connecting to the SongQuiz server.">
        <Button size="lg" onClick={app.leaveRoom}>Cancel</Button>
      </ScreenHeader>
    </div>
  );
}

function Lobby({ app }: ScreenProps) {
  const { room, round, online } = app;
  if (!room) return online ? <Connecting app={app} code={online.code} /> : <NoRoom app={app} />;

  const playlist = playlistById(room.playlistId);
  const me = room.players.find((p) => p.id === ME);
  const host = room.players.find((p) => p.id === room.hostId);
  const isHost = canHost(room, ME);

  function copyCode() {
    const failed = () => app.flash('Couldn’t copy the code', 'Tell your friends: ' + room!.code);
    try {
      navigator.clipboard.writeText(room!.code).then(() => app.flash('Room code copied', `Send ${room!.code} to your friends`), failed);
    } catch {
      failed();
    }
  }

  return (
    <div className="app-screen">
      <div className="app-room-head">
        <div className="app-room-title">
          <h1 className="app-question">{room.name}</h1>
          <div className="app-meta">
            <Badge icon="playlist">{playlist.title}</Badge>
            <Badge>{room.rounds} rounds</Badge>
            <Badge>{room.snippet} s snippets</Badge>
            <Badge>{GUESS_LABELS[room.guess ?? 'separate']}</Badge>
            {room.hosting === 'everyone' ? <Badge icon="users">Everyone hosts</Badge> : null}
            {room.hostControls === 'on' ? <Badge icon="pause">Pause & skip</Badge> : null}
            {canVoteSkip(room) ? <Badge>{SKIP_COMMAND} votes</Badge> : null}
          </div>
        </div>
        <div className="app-code-box">
          <span className="app-code-label">Room code</span>
          <span className="app-code">{room.code}</span>
          <Button onClick={copyCode}>Copy code</Button>
        </div>
      </div>

      <Section title="Players" hint={`${room.players.length} of ${room.maxPlayers} joined · ${readyCount(room)} ready`}>
        <Table
          caption={'Players in ' + room.name}
          columns={[{ label: '#', className: 'sq-col-rank' }, { label: 'Player' }, { label: 'Status', className: 'sq-col-status' }]}
        >
          {room.players.map((p, i) => {
            const notes = [p.id === room.hostId && 'host', p.id === ME && 'you'].filter(Boolean);
            return (
              <tr key={p.id} className={p.id === ME ? 'is-on' : undefined}>
                <td className="sq-col-rank">{i + 1}</td>
                <td>
                  {p.name}
                  {notes.length ? <span className="sq-list-note">{` (${notes.join(', ')})`}</span> : null}
                </td>
                <td className="sq-col-status">
                  {p.connected === false ? <Badge icon="clock">Away</Badge>
                    : p.ready ? <Badge tone="aqua" icon="check">Ready</Badge>
                    : <Badge>Not ready</Badge>}
                </td>
              </tr>
            );
          })}
        </Table>
      </Section>

      {round ? (
        <Notice>
          Round {round.number} of {round.total} is on. Guess in the chat. {GUESS_RULES[round.guess]} Wrong guesses
          show up for everyone, right ones stay hidden.
        </Notice>
      ) : isHost ? null : (
        <Notice>
          {online
            ? `${host?.name ?? 'The host'} starts the game. Guesses go in the chat on the right.`
            : `${host?.name ?? 'The host'} starts the game when you’re ready. Guesses go in the chat on the right.`}
        </Notice>
      )}
      {online?.status === 'reconnecting' ? <Notice>Lost the connection to the server. Trying again…</Notice> : null}

      <div className="app-form-actions">
        <Button size="lg" onClick={app.leaveRoom}>Leave room</Button>
        <Button size="lg" icon={me?.ready ? null : 'check'} onClick={app.toggleReady}>{me?.ready ? 'I’m not ready' : 'I’m ready'}</Button>
        <EndGameButton app={app} />
        {round && isHost && waitsForHost(round)
          ? <NextRoundButton app={app} />
          : round
          ? <Button variant="primary" size="lg" disabled>Game in progress</Button>
          : isHost
          ? <Button variant="primary" size="lg" onClick={app.startGame}>Start game</Button>
          : <Button variant="primary" size="lg" disabled>Waiting for {host?.name ?? 'the host'}</Button>}
      </div>

      {isHost && !round ? <RoomSettings app={app} /> : null}
    </div>
  );
}

export const lobbyScreen: ScreenDef = {
  title: 'Lobby',
  Component: Lobby,
  lcd: ({ room, online }) => room
    ? { title: `${room.name} · code ${room.code}`, subtitle: `${readyCount(room)} of ${room.players.length} players ready` }
    : online
    ? { title: `Joining room ${online.code}`, subtitle: 'Connecting to the server' }
    : { title: 'No room', subtitle: 'Create one or join with a code' },
  status: ({ room, online }) => {
    if (!room) return online ? 'Connecting' : 'Not in a room';
    const n = room.players.length;
    return `${n} ${n === 1 ? 'player' : 'players'}, ${room.rounds} rounds, ${playlistById(room.playlistId).title}`;
  }
};
