// Create: pick the rules and a playlist, then open the room.
import { useState, type FormEvent } from 'react';
import { Button } from '../components/controls/Button';
import { ScreenHeader } from '../components/content/Layout';
import { playlists } from '../data/demo';
import { NO_EFFECTS } from '../game/effects';
import type { RoomOptions, ScreenDef, ScreenProps } from '../types';
import { NAME_MISSING, RoomForm } from './RoomForm';

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
      <ScreenHeader title="Create a room" hint="Choose the music and the rules. You get a code to share as soon as the room opens." />

      <RoomForm options={options} onChange={change} nameError={error} />

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
  lcd: () => ({ title: 'New room', subtitle: 'Pick the rules and a playlist' }),
  status: () => `${playlists.length} playlists to choose from`
};
