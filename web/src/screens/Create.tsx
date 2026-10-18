// Create: pick the rules and a playlist, then open the room.
import { useState, type FormEvent } from 'react';
import { AlbumGrid, AlbumTile, Button, SegmentedControl } from '@songquiz/ui';
import { Field, Setting } from '../components/form';
import { ScreenHeader, Section, Sheet } from '../components/layout';
import { playlistById, playlists } from '../data/demo';
import type { AnswerMode, RoomOptions, ScreenDef, ScreenProps } from '../types';

const ANSWER_HINTS: Record<AnswerMode, string> = {
  covers: 'Players pick the song from six covers.',
  typed: 'Players type the title or the artist.'
};

function Create({ app, id }: ScreenProps) {
  const [options, setOptions] = useState<RoomOptions>({
    name: app.settings.name + '’s room',
    playlistId: id ?? 'synth-80s',
    rounds: '10', mode: 'covers', snippet: '20', maxPlayers: '8'
  });
  const [error, setError] = useState<string | null>(null);
  const playlist = playlistById(options.playlistId);

  function set<K extends keyof RoomOptions>(key: K) {
    return (value: RoomOptions[K]) => {
      setOptions({ ...options, [key]: value });
      if (key === 'name') setError(null);
    };
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!options.name.trim()) {
      setError('Give the room a name so friends know they’re in the right place.');
      return;
    }
    app.createRoom({ ...options, name: options.name.trim() });
  }

  return (
    <form className="app-screen" onSubmit={submit} noValidate>
      <ScreenHeader title="Create a room" hint="Choose the music and the rules. You get a code to share as soon as the room opens." />

      <div className="app-columns">
        <Sheet title="Rules">
          <Field id="room-name" label="Room name" icon="broadcast" maxLength={32} value={options.name} error={error} onChange={set('name')} />
          <Setting label="Rounds">
            <SegmentedControl label="Rounds" options={['5', '10', '15', '20']} value={options.rounds} onChange={set('rounds')} />
          </Setting>
          <Setting label="Answers" hint={ANSWER_HINTS[options.mode]}>
            <SegmentedControl
              label="Answers" value={options.mode} onChange={(v) => set('mode')(v as AnswerMode)}
              options={[{ value: 'covers', label: 'Pick a cover' }, { value: 'typed', label: 'Type it' }]}
            />
          </Setting>
          <Setting label="Snippet length">
            <SegmentedControl
              label="Snippet length" value={options.snippet} onChange={set('snippet')}
              options={[{ value: '10', label: '10 s' }, { value: '20', label: '20 s' }, { value: '30', label: '30 s' }]}
            />
          </Setting>
          <Setting label="Max players">
            <SegmentedControl label="Max players" options={['4', '8', '12']} value={options.maxPlayers} onChange={set('maxPlayers')} />
          </Setting>
        </Sheet>

        <Section title="Playlist" hint={`${playlist.title} · ${playlist.subtitle} · ${playlist.level}`}>
          <AlbumGrid label="Choose a playlist">
            {playlists.map((p) => (
              <AlbumTile
                key={p.id} art={p.art} title={p.title} subtitle={p.subtitle}
                state={p.id === options.playlistId ? 'selected' : 'idle'}
                onClick={() => set('playlistId')(p.id)}
              />
            ))}
          </AlbumGrid>
        </Section>
      </div>

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
