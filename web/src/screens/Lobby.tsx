// Lobby: the room code to share, who is in the room and who is ready.
import { useState } from 'react';
import { Badge, Button } from '@songquiz/ui';
import { Notice, ScreenHeader, Section } from '../components/layout';
import { Table } from '../components/Table';
import { playlistById } from '../data/demo';
import { ME, type AnswerMode, type AppApi, type Room, type ScreenDef, type ScreenProps } from '../types';

const MODE_LABELS: Record<AnswerMode, string> = { covers: 'Pick a cover', typed: 'Type it' };

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

function Lobby({ app }: ScreenProps) {
  const [triedStart, setTriedStart] = useState(false);
  const { room } = app;
  if (!room) return <NoRoom app={app} />;

  const playlist = playlistById(room.playlistId);
  const me = room.players.find((p) => p.id === ME);
  const host = room.players.find((p) => p.id === room.hostId);
  const isHost = room.hostId === ME;

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
            <Badge>{MODE_LABELS[room.mode]}</Badge>
            <Badge>{room.snippet} s snippets</Badge>
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
                  {p.ready ? <Badge tone="aqua" icon="check">Ready</Badge> : <Badge>Not ready</Badge>}
                </td>
              </tr>
            );
          })}
        </Table>
      </Section>

      {triedStart ? <Notice>Gameplay isn’t part of this prototype yet. In the full game the first round would start now.</Notice> : null}

      <div className="app-form-actions">
        <Button size="lg" onClick={app.leaveRoom}>Leave room</Button>
        <Button size="lg" icon={me?.ready ? null : 'check'} onClick={app.toggleReady}>{me?.ready ? 'I’m not ready' : 'I’m ready'}</Button>
        {isHost
          ? <Button variant="primary" size="lg" onClick={() => setTriedStart(true)}>Start game</Button>
          : <Button variant="primary" size="lg" disabled>Waiting for {host?.name ?? 'the host'}</Button>}
      </div>
    </div>
  );
}

export const lobbyScreen: ScreenDef = {
  title: 'Lobby',
  Component: Lobby,
  lcd: ({ room }) => room
    ? { title: `${room.name} · code ${room.code}`, subtitle: `${readyCount(room)} of ${room.players.length} players ready` }
    : { title: 'No room', subtitle: 'Create one or join with a code' },
  status: ({ room }) => {
    if (!room) return 'Not in a room';
    const n = room.players.length;
    return `${n} ${n === 1 ? 'player' : 'players'}, ${room.rounds} rounds, ${playlistById(room.playlistId).title}`;
  }
};
