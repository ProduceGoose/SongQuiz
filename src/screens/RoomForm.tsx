// The room's rules and playlist. Create fills it in for a new room (RoomForm); the host changes a
// room's rules and playlist between games in the lobby and under a game's result (RoomSettings).
// The name is set once, when the room is created.
import { AlbumGrid } from '../components/albums/AlbumGrid';
import { AlbumTile } from '../components/albums/AlbumTile';
import { SegmentedControl } from '../components/controls/SegmentedControl';
import { Field, Setting } from '../components/content/Form';
import { Section, Sheet } from '../components/content/Layout';
import { playlistById, playlists } from '../data/demo';
import { ADVANCE_LABELS, HOST_CONTROL_LABELS, SKIP_COMMAND, VOTE_SKIP_LABELS, MAX_PLAYER_OPTIONS, GUESS_LABELS, HOSTING_LABELS, optionsOf, ROUND_OPTIONS, SNIPPET_OPTIONS } from '../game/rooms';
import { MIN_ROUND_SECONDS, REVEAL_SECONDS } from '../game/preview';
import { SPEED_LABELS, SPEED_RATES, SWITCH_LABELS, TONE_LABELS } from '../game/effects';
import { GUESS_RULES } from '../game/scoring';
import type { Advance, AppApi, GuessMode, HostControls, Hosting, RoomEffects, RoomOptions, VoteSkip } from '../types';

const HOSTING_WARNING = 'Are you trusting your friends this much?';

const segments = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));

/** The effects on the song: one choice per kind, so they stack across kinds but not within one. */
function EffectsSheet({ effects, onChange }: { effects: RoomEffects; onChange: (effects: RoomEffects) => void }) {
  const set = <K extends keyof RoomEffects>(key: K) => (value: string) => onChange({ ...effects, [key]: value as RoomEffects[K] });
  const random = effects.random === 'on';
  return (
    <Sheet title="Effects">
      <Setting label="Random mix" hint={random ? 'Each round gets its own mix of the effects below.' : 'A different mix of effects every round.'}>
        <SegmentedControl label="Random mix" value={effects.random} onChange={set('random')} options={segments(SWITCH_LABELS)} />
      </Setting>
      {random ? null : <>
        <Setting label="Speed" hint={`Fast plays at ${SPEED_RATES.fast}×, slow at ${SPEED_RATES.slow}×, and the pitch goes with it.`}>
          <SegmentedControl label="Speed" value={effects.speed} onChange={set('speed')} options={segments(SPEED_LABELS)} />
        </Setting>
        <Setting label="Sound" hint="Muffled sounds like it’s through a wall; telephone like an old phone line.">
          <SegmentedControl label="Sound" value={effects.tone} onChange={set('tone')} options={segments(TONE_LABELS)} />
        </Setting>
        <Setting label="Distortion" hint="Overdriven and crunchy, like a cheap speaker.">
          <SegmentedControl label="Distortion" value={effects.distort} onChange={set('distort')} options={segments(SWITCH_LABELS)} />
        </Setting>
      </>}
      <p className="app-help">Effects play while you guess. At the reveal the song plays clean.</p>
    </Sheet>
  );
}

function snippetHint(snippet: string): string {
  const seconds = Number(snippet);
  if (seconds <= 0.1) return `0.1 seconds? This is literally impossible. Guessing still lasts ${MIN_ROUND_SECONDS} s.`;
  return seconds < MIN_ROUND_SECONDS ? `Seconds of the song. Guessing still lasts ${MIN_ROUND_SECONDS} s.` : 'Seconds of the song.';
}

export const NAME_MISSING = 'Give the room a name so friends know they’re in the right place.';

interface RoomFormProps {
  options: RoomOptions;
  onChange: (options: RoomOptions) => void;
  nameError?: string | null;
  /** A new room: shows the name and host controls, which can't change once the room is open. Default true. */
  creating?: boolean;
  /** The playlist under the rules instead of beside them. */
  stacked?: boolean;
  /** Title of the rules sheet. Default "Rules". */
  title?: string;
  /** Players already in the room, shown next to the player limit. */
  players?: number;
}

export function RoomForm({ options, onChange, nameError, creating = true, stacked, title = 'Rules', players }: RoomFormProps) {
  const playlist = playlistById(options.playlistId);
  const set = <K extends keyof RoomOptions>(key: K) => (value: RoomOptions[K]) => onChange({ ...options, [key]: value });
  const setHosting = (value: string) => {
    if (value === 'everyone' && !window.confirm(HOSTING_WARNING)) return;
    set('hosting')(value as Hosting);
  };
  return (
    <div className={stacked ? 'app-columns is-stacked' : 'app-columns'}>
      <div className="app-stack">
        <Sheet title={title}>
          {creating ? <Field id="room-name" label="Room name" icon="broadcast" maxLength={32} value={options.name} error={nameError} onChange={set('name')} /> : null}
          <Setting label="Rounds">
            <SegmentedControl label="Rounds" options={ROUND_OPTIONS} value={options.rounds} onChange={set('rounds')} />
          </Setting>
          <Setting label="Snippet length" hint={snippetHint(options.snippet)}>
            <SegmentedControl label="Snippet length in seconds" value={options.snippet} onChange={set('snippet')} options={SNIPPET_OPTIONS} />
          </Setting>
          <Setting label="Guesses" hint={GUESS_RULES[options.guess]}>
            <SegmentedControl
              label="Guesses" value={options.guess} onChange={(v) => set('guess')(v as GuessMode)}
              options={Object.entries(GUESS_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Setting>
          <Setting label="Max players" hint={players ? `${players} in the room now` : undefined}>
            <SegmentedControl label="Max players" options={MAX_PLAYER_OPTIONS} value={options.maxPlayers} onChange={set('maxPlayers')} />
          </Setting>
          <Setting
            label="Next round"
            hint={options.advance === 'host' ? 'Starts when a host presses Next round.' : `Starts ${REVEAL_SECONDS} s after the answer is shown.`}
          >
            <SegmentedControl
              label="Next round" value={options.advance} onChange={(v) => set('advance')(v as Advance)}
              options={Object.entries(ADVANCE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Setting>
          <Setting
            label="Hosts"
            hint={options.hosting === 'everyone' ? 'Everyone can start games, change these settings and reset the scores.' : 'Who can start games and change these settings.'}
          >
            <SegmentedControl
              label="Hosts" value={options.hosting} onChange={setHosting}
              options={Object.entries(HOSTING_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Setting>
          {creating ? (
            <Setting
              label="Host controls"
              hint="Hosts can pause a round for everyone or skip a song, with the buttons at the top left. This can’t be changed once the room is open."
            >
              <SegmentedControl
                label="Host controls" value={options.hostControls} onChange={(v) => set('hostControls')(v as HostControls)}
                options={Object.entries(HOST_CONTROL_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Setting>
          ) : null}
          {options.hostControls !== 'on' ? (
            <Setting label="Vote to skip" hint={`Players type ${SKIP_COMMAND} in the chat. The song is skipped once half of them have.`}>
              <SegmentedControl
                label="Vote to skip" value={options.voteSkip} onChange={(v) => set('voteSkip')(v as VoteSkip)}
                options={Object.entries(VOTE_SKIP_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Setting>
          ) : null}
        </Sheet>
        <EffectsSheet effects={options.effects} onChange={set('effects')} />
      </div>

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
  );
}

/** The host's settings for the room they're in, between games. Each change goes to the room right away. */
export function RoomSettings({ app }: { app: AppApi }) {
  const room = app.room!;

  function change(next: RoomOptions) {
    if (Number(next.maxPlayers) < room.players.length) {
      app.flash('Too many players for that limit', `${room.players.length} players are in ${room.name}`);
    } else {
      app.updateRoom(next);
    }
  }

  return (
    <RoomForm
      title="Room settings" options={optionsOf(room)} onChange={change}
      creating={false} stacked players={room.players.length}
    />
  );
}
