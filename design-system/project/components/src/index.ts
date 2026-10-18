// SongQuiz Aqua components. The app imports this file directly (as "@songquiz/ui");
// `npm run build:design-system` builds it into ../bundle.js for the design system page.
export { Icon, iconNames, type IconName, type IconProps } from './Icon';
export { Window, Toolbar, type WindowProps, type ToolbarProps } from './Window';
export {
  Transport, TransportButton, VolumeSlider, LcdDisplay,
  type TransportProps, type TransportButtonProps, type VolumeSliderProps, type LcdDisplayProps
} from './Playback';
export {
  SegmentedControl, SearchField, Button,
  type SegmentOption, type SegmentedControlProps, type SearchFieldProps, type ButtonProps
} from './Controls';
export { SourceList, type SourceItem, type SourceSection, type SourceListProps } from './SourceList';
export {
  AlbumGrid, AlbumTile, NowPlaying,
  type AlbumGridProps, type AlbumTileProps, type AlbumTileState, type NowPlayingProps
} from './Album';
export {
  Badge, Leaderboard, BarButton, StatusBar,
  type BadgeTone, type BadgeProps, type PlayerStatus, type LeaderboardPlayer, type LeaderboardProps,
  type BarButtonProps, type StatusBarProps
} from './Status';
export { formatTime } from './utils';
