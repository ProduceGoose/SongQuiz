// The app's toolbar: playback and volume on the left, the LCD in the middle,
// the playlist view switch and search on the right.
import { controlsRound, waitsForHost } from '../../game/rooms';
import { ME, type AppApi } from '../../types';
import { SearchField } from '../controls/SearchField';
import { SegmentedControl } from '../controls/SegmentedControl';
import { AppLcd, type AppLcdProps } from '../lcd/AppLcd';
import { Toolbar } from './Toolbar';
import { Transport, type TransportProps } from './Transport';
import { VolumeSlider } from './VolumeSlider';

/**
 * The playback buttons. For you alone they pause your sound and replay the snippet; in a room with
 * host controls, a host's play button pauses the round for everyone and skip ends the song (or,
 * while the room waits, starts the next round).
 */
function transport(app: AppApi): TransportProps {
  const { room, round, snippet } = app;
  const own: TransportProps = { playing: snippet.playing, disabled: !snippet.available, onToggle: snippet.toggle, onPrevious: snippet.replay };
  if (!room || !round || !controlsRound(room, ME)) return own;
  if (round.phase === 'playing') {
    return { playing: round.pausedAt === undefined, onToggle: () => app.pauseRound(round.pausedAt === undefined), onNext: app.skipRound, onPrevious: snippet.available ? snippet.replay : undefined };
  }
  return waitsForHost(round) ? { ...own, disabled: false, onToggle: snippet.available ? snippet.toggle : undefined, onPrevious: undefined, onNext: app.nextRound } : own;
}

export function AppToolbar({ app, screen, message }: AppLcdProps) {
  return (
    <Toolbar
      start={<>
        <Transport {...transport(app)} />
        <VolumeSlider value={app.settings.volume} onChange={(v) => app.updateSettings({ volume: v })} />
      </>}
      center={<AppLcd app={app} screen={screen} message={message} />}
      end={<>
        {screen.toolbarViews ? (
          <SegmentedControl
            label="View" value={app.playlistView} onChange={(v) => app.setPlaylistView(v as 'grid' | 'list')}
            options={[{ value: 'list', icon: 'list', title: 'List' }, { value: 'grid', icon: 'grid', title: 'Covers' }]}
          />
        ) : null}
        <SearchField
          placeholder="Search playlists" label="Search playlists, songs and artists"
          value={app.query} onChange={app.setQuery} onSubmit={() => app.go('playlists')}
        />
      </>}
    />
  );
}
