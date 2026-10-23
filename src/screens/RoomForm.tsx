// A room's settings. What can't change once the room is open, its name and the host controls, is
// all that Create asks for (RoomBasics). The rules, effects and playlist come after: the host sets
// them in the lobby and under a game's result (RoomSettings), and a new room starts with defaults.
import { AlbumGrid } from '../components/albums/AlbumGrid';
import { AlbumTile } from '../components/albums/AlbumTile';
import { SegmentedControl } from '../components/controls/SegmentedControl';
import { Field, Setting } from '../components/content/Form';
import { Section, Sheet } from '../components/content/Layout';
import { isSolo, modeArt, playlistById } from '../data/demo';
import { ADVANCE_LABELS, HOST_CONTROL_LABELS, MODE_LABELS, SKIP_COMMAND, VOTE_SKIP_LABELS, MAX_PLAYER_OPTIONS, GUESS_LABELS, HOSTING_LABELS, optionsOf, ROUND_OPTIONS, SNIPPET_OPTIONS } from '../game/rooms';
import { MIN_ROUND_SECONDS, REVEAL_SECONDS } from '../game/preview';
import { SPEED_LABELS, SPEED_RATES, SWITCH_LABELS, TONE_LABELS } from '../game/effects';
import { GUESS_RULES } from '../game/scoring';
import { COOP_RULES, LIVES } from '../game/survival';
import { modePlaylists, PICK_HINTS, PICK_LABELS } from '../game/playlistPick';
import { isYearPlaylist, YEAR_RULES } from '../game/years';
import type { Advance, AppApi, GameMode, GuessMode, PlaylistPick, HostControls, Hosting, RoomEffects, RoomOptions, VoteSkip } from '../types';

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
        <Setting label="Reverb" hint="A big empty hall around the song.">
          <SegmentedControl label="Reverb" value={effects.reverb ?? 'off'} onChange={set('reverb')} options={segments(SWITCH_LABELS)} />
        </Setting>
        <Setting label="Delay" hint="Every sound echoes a few times.">
          <SegmentedControl label="Delay" value={effects.delay ?? 'off'} onChange={set('delay')} options={segments(SWITCH_LABELS)} />
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

interface RoomBasicsProps {
  options: RoomOptions;
  onChange: (options: RoomOptions) => void;
  nameError?: string | null;
}

/** For a new room: what can't change once it's open. */
export function RoomBasics({ options, onChange, nameError }: RoomBasicsProps) {
  const set = <K extends keyof RoomOptions>(key: K) => (value: RoomOptions[K]) => onChange({ ...options, [key]: value });
  return (
    <Sheet title="Room">
      <Field id="room-name" label="Room name" icon="broadcast" maxLength={32} value={options.name} error={nameError} onChange={set('name')} />
      <Setting label="Max players" hint="How many can join, you included. This can’t be changed once the room is open.">
        <SegmentedControl label="Max players" options={MAX_PLAYER_OPTIONS} value={options.maxPlayers} onChange={set('maxPlayers')} />
      </Setting>
      <Setting
        label="Host controls"
        hint="Hosts can pause a round for everyone or skip a song, with the buttons at the top left. This can’t be changed once the room is open."
      >
        <SegmentedControl
          label="Host controls" value={options.hostControls} onChange={(v) => set('hostControls')(v as HostControls)}
          options={Object.entries(HOST_CONTROL_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </Setting>
      <p className="app-help">
        The game mode, the playlist ({playlistById(options.playlistId).title}), the rules and the effects can be changed in the room once it’s open, before each game.
      </p>
    </Sheet>
  );
}

interface RoomFormProps {
  options: RoomOptions;
  onChange: (options: RoomOptions) => void;
  /** The playlist under the rules instead of beside them. */
  stacked?: boolean;
  /** Title of the rules sheet. Default "Rules". */
  title?: string;
  /** A solo game: leaves out what only matters with others (hosts, votes). */
  solo?: boolean;
}

/** Under each mode's cover. */
const MODE_SUBTITLES: Record<GameMode, string> = { casual: 'The Usual', coop: `Together, ${LIVES} lives`, years: 'Guess the year' };
/** The chosen mode's rules, over the covers. */
const MODE_HINTS: Record<GameMode, string> = {
  casual: 'Your playlist, your rules, and the most points win.',
  coop: COOP_RULES,
  years: YEAR_RULES + ' The decade playlists sit this one out.'
};

/**
 * The mode, rules, effects and playlist of an open room. The mode has its own section of covers
 * above the rest. Coop picks its own playlists and effects (game/survival.ts), so the settings
 * below leave those out, with the rounds and the guess mode. Year guessing has no guess mode
 * either, and only offers the playlists that don't give the year away (game/years.ts).
 */
export function RoomForm({ options, onChange, stacked, title = 'Rules', solo }: RoomFormProps) {
  const playlist = playlistById(options.playlistId);
  const coop = options.mode === 'coop';
  const years = options.mode === 'years';
  const set = <K extends keyof RoomOptions>(key: K) => (value: RoomOptions[K]) => onChange({ ...options, [key]: value });
  // A decade playlist doesn't carry over to year guessing.
  const setMode = (mode: GameMode) =>
    onChange({ ...options, mode, playlistId: mode === 'years' && !isYearPlaylist(options.playlistId) ? 'random' : options.playlistId });
  const setHosting = (value: string) => {
    if (value === 'everyone' && !window.confirm(HOSTING_WARNING)) return;
    set('hosting')(value as Hosting);
  };
  return (
    <>
      {solo ? null : (
        <Section title="Game mode" hint={MODE_HINTS[options.mode]}>
          <AlbumGrid label="Choose a game mode">
            {(Object.keys(MODE_LABELS) as GameMode[]).map((mode) => (
              <AlbumTile
                key={mode} art={modeArt(mode)} title={MODE_LABELS[mode]} subtitle={MODE_SUBTITLES[mode]}
                state={mode === options.mode ? 'selected' : 'idle'}
                onClick={() => setMode(mode)}
              />
            ))}
          </AlbumGrid>
        </Section>
      )}
      <div className={stacked ? 'app-columns is-stacked' : 'app-columns'}>
        <div className="app-stack">
          <Sheet title={title}>
            {coop ? null : (
              <Setting label="Playlist selection" hint={PICK_HINTS[options.pick]}>
                <SegmentedControl
                  label="Playlist selection" value={options.pick} onChange={(v) => set('pick')(v as PlaylistPick)}
                  options={Object.entries(PICK_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </Setting>
            )}
            {coop ? null : (
              <Setting label="Rounds">
                <SegmentedControl label="Rounds" options={ROUND_OPTIONS} value={options.rounds} onChange={set('rounds')} />
              </Setting>
            )}
            {coop ? null : (
              <Setting label="Snippet length" hint={snippetHint(options.snippet)}>
                <SegmentedControl label="Snippet length in seconds" value={options.snippet} onChange={set('snippet')} options={SNIPPET_OPTIONS} />
              </Setting>
            )}
            {coop || years ? null : (
              <Setting label="Guesses" hint={GUESS_RULES[options.guess]}>
                <SegmentedControl
                  label="Guesses" value={options.guess} onChange={(v) => set('guess')(v as GuessMode)}
                  options={Object.entries(GUESS_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </Setting>
            )}
            <Setting
              label="Next round"
              hint={options.advance === 'host' ? 'Starts when a host presses Next round.' : `Starts ${REVEAL_SECONDS} s after the answer is shown.`}
            >
              <SegmentedControl
                label="Next round" value={options.advance} onChange={(v) => set('advance')(v as Advance)}
                options={Object.entries(ADVANCE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Setting>
            {solo ? null : (
              <Setting
                label="Hosts"
                hint={options.hosting === 'everyone' ? 'Everyone can start games, change these settings and reset the scores.' : 'Who can start games and change these settings.'}
              >
                <SegmentedControl
                  label="Hosts" value={options.hosting} onChange={setHosting}
                  options={Object.entries(HOSTING_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </Setting>
            )}
            {options.hostControls !== 'on' && !solo && !coop ? (
              <Setting label="Vote to skip" hint={`Players type ${SKIP_COMMAND} in the chat. The song is skipped once half of them have.`}>
                <SegmentedControl
                  label="Vote to skip" value={options.voteSkip} onChange={(v) => set('voteSkip')(v as VoteSkip)}
                  options={Object.entries(VOTE_SKIP_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </Setting>
            ) : null}
          </Sheet>
          {coop ? null : <EffectsSheet effects={options.effects} onChange={set('effects')} />}
        </div>

        {/* Coop and casual with a vote or the slot machine pick their own. */}
        {coop || options.pick !== 'host' ? null : (
          <Section
            title="Playlist"
            hint={`${playlist.title} · ${playlist.subtitle} · ${playlist.level}` + (years ? ' · No decade playlists when you guess the year.' : '')}
          >
            <AlbumGrid label="Choose a playlist">
              {modePlaylists(options.mode).map((p) => (
                <AlbumTile
                  key={p.id} art={p.art} title={p.title} subtitle={p.subtitle}
                  state={p.id === options.playlistId ? 'selected' : 'idle'}
                  onClick={() => set('playlistId')(p.id)}
                />
              ))}
            </AlbumGrid>
          </Section>
        )}
      </div>
    </>
  );
}

/** The host's settings for the room they're in, between games. Each change goes to the room right away. */
export function RoomSettings({ app }: { app: AppApi }) {
  const room = app.room!;

  return (
    <RoomForm
      title={isSolo(room) ? 'Game settings' : 'Room settings'} options={optionsOf(room)} onChange={app.updateRoom}
      stacked solo={isSolo(room)}
    />
  );
}
