// Create: name the room and choose what can't change later, then open it. The rules, effects and
// playlist start with the defaults below; the host changes them in the room (see RoomForm.tsx).
import { useState, type FormEvent } from 'react';
import { Button } from '../components/controls/Button';
import { ScreenHeader } from '../components/content/Layout';
import { playlists } from '../data/demo';
import { NO_EFFECTS } from '../game/effects';
import type { RoomOptions, ScreenDef, ScreenProps } from '../types';
import { NAME_MISSING, RoomBasics } from './RoomForm';

function Create({ app, id }: ScreenProps) {
  const [options, setOptions] = useState<RoomOptions>({
    name: app.settings.name + '’s room',
    playlistId: id ?? 'synth-80s',
    rounds: '10', snippet: '20', guess: 'separate', hosting: 'host', advance: 'auto', hostControls: 'off', voteSkip: 'off', effects: NO_EFFECTS, maxPlayers: '8'
  });
  const [error, setError] = useState<string | null>(null);

  function change(next: RoomOptions) {
    if (next.name !== options.name) setError(null);
    setOptions(next);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!options.name.trim()) {
      setError(NAME_MISSING);
      return;
    }
    app.createRoom({ ...options, name: options.name.trim() });
  }

  return (
    <form className="app-screen" onSubmit={submit} noValidate>
      <ScreenHeader title="Create a room" hint="Name it and open it. You get a code to share right away, and choose the music and the rules in the room." />

      <RoomBasics options={options} onChange={change} nameError={error} />

      <div className="app-form-actions">
        <Button size="lg" onClick={() => app.go('home')}>Cancel</Button>
        <Button variant="primary" size="lg" type="submit">Open room</Button>
      </div>
    </form>
  );
}

export const createScreen: ScreenDef = {
  title: 'Create a room',
  Component: Create,
  lcd: () => ({ title: 'New room', subtitle: 'Name it and open it' }),
  status: () => `${playlists.length} playlists to choose from`
};
