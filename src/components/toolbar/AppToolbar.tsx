// The app's toolbar: playback and volume on the left, the LCD in the middle,
// the playlist view switch and search on the right.
import { SearchField } from '../controls/SearchField';
import { SegmentedControl } from '../controls/SegmentedControl';
import { AppLcd, type AppLcdProps } from '../lcd/AppLcd';
import { Toolbar } from './Toolbar';
import { Transport } from './Transport';
import { VolumeSlider } from './VolumeSlider';

export function AppToolbar({ app, screen, message }: AppLcdProps) {
  return (
    <Toolbar
      start={<>
        <Transport
          playing={app.snippet.playing} disabled={!app.snippet.available}
          onToggle={app.snippet.toggle} onPrevious={app.snippet.replay}
        />
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
