// The SongQuiz Aqua design system: every reusable component, grouped by where it sits in the window.
// `npm run build:design-system` builds this file into design-system/project/components/bundle.js
// and bundle.css. The app imports the components from their own files instead.
import './base.css';

export { formatTime } from './utils';
export { Icon, iconNames, type IconName, type IconProps } from './controls/Icon';

// Window frame
export { Window, type WindowProps } from './window/Window';

// Toolbar, with the LCD in the middle
export { Toolbar, type ToolbarProps } from './toolbar/Toolbar';
export { Transport, TransportButton, type TransportProps, type TransportButtonProps } from './toolbar/Transport';
export { VolumeSlider, type VolumeSliderProps } from './toolbar/VolumeSlider';
export { LcdDisplay, type LcdDisplayProps } from './lcd/LcdDisplay';

// Controls used in the toolbar and on screens
export { SegmentedControl, type SegmentOption, type SegmentedControlProps } from './controls/SegmentedControl';
export { SearchField, type SearchFieldProps } from './controls/SearchField';
export { Button, type ButtonProps } from './controls/Button';
export { Badge, type BadgeTone, type BadgeProps } from './controls/Badge';

// Sidebar
export { SourceList, type SourceItem, type SourceSection, type SourceListProps } from './sidebar/SourceList';
export { NowPlaying, type NowPlayingProps } from './sidebar/NowPlaying';

// Content area
export { AlbumGrid, type AlbumGridProps } from './albums/AlbumGrid';
export { AlbumTile, type AlbumTileProps, type AlbumTileState } from './albums/AlbumTile';
export { Leaderboard, type PlayerStatus, type LeaderboardPlayer, type LeaderboardProps } from './tables/Leaderboard';

// Chat panel on the right
export { ChatPanel, type ChatPanelProps } from './chat/ChatPanel';
export { ChatMessage, Avatar, type ChatEntry } from './chat/ChatMessage';

// Status bar
export { StatusBar, BarButton, type StatusBarProps, type BarButtonProps } from './statusbar/StatusBar';
