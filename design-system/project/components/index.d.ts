// Public API of the SongQuiz Aqua components, as documentation. The implementation is in the repository's src/components/.
import type * as React from 'react';

export type IconName =
  | 'play' | 'pause' | 'prev' | 'next' | 'volume-low' | 'volume-high' | 'search' | 'plus' | 'shuffle' | 'repeat'
  | 'music' | 'playlist' | 'user' | 'users' | 'trophy' | 'check' | 'cross' | 'clock' | 'list' | 'grid'
  | 'disclosure' | 'disclosure-down' | 'broadcast' | 'chat';

export interface IconProps { name: IconName; size?: number; title?: string; className?: string; style?: React.CSSProperties }
export declare function Icon(props: IconProps): React.ReactElement;

export interface WindowProps {
  title?: React.ReactNode;
  toolbar?: React.ReactNode;
  sidebar?: React.ReactNode;
  panel?: React.ReactNode;
  statusBar?: React.ReactNode;
  children?: React.ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Window(props: WindowProps): React.ReactElement;

export interface ToolbarProps { start?: React.ReactNode; center?: React.ReactNode; end?: React.ReactNode; className?: string }
export declare function Toolbar(props: ToolbarProps): React.ReactElement;

export interface TransportProps { playing?: boolean; onPrevious?: () => void; onToggle?: () => void; onNext?: () => void; disabled?: boolean; className?: string }
export declare function Transport(props: TransportProps): React.ReactElement;

export interface TransportButtonProps { icon?: 'play' | 'pause' | 'prev' | 'next'; size?: 'md' | 'lg'; label?: string; onClick?: () => void; disabled?: boolean; className?: string }
export declare function TransportButton(props: TransportButtonProps): React.ReactElement;

export interface VolumeSliderProps { value?: number; defaultValue?: number; onChange?: (value: number) => void; min?: number; max?: number; label?: string; disabled?: boolean; className?: string }
export declare function VolumeSlider(props: VolumeSliderProps): React.ReactElement;

export interface LcdDisplayProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** 0–1; omit to hide the progress bar. */
  progress?: number;
  /** Seconds (formatted m:ss) or a preformatted string. */
  elapsed?: number | string;
  /** Seconds left (shown as -m:ss) or a preformatted string. */
  remaining?: number | string;
  start?: React.ReactNode;
  end?: React.ReactNode;
  progressLabel?: string;
  className?: string;
}
export declare function LcdDisplay(props: LcdDisplayProps): React.ReactElement;

export interface SegmentOption { value: string; label?: string; icon?: IconName; title?: string }
export interface SegmentedControlProps { options: Array<string | SegmentOption>; value?: string; defaultValue?: string; onChange?: (value: string) => void; label?: string; className?: string }
export declare function SegmentedControl(props: SegmentedControlProps): React.ReactElement;

export interface SearchFieldProps {
  value?: string; defaultValue?: string; onChange?: (text: string) => void; onSubmit?: (text: string) => void;
  placeholder?: string; size?: 'md' | 'lg'; icon?: IconName; label?: string; disabled?: boolean; autoFocus?: boolean; className?: string;
}
export declare function SearchField(props: SearchFieldProps): React.ReactElement;

export interface ButtonProps {
  children?: React.ReactNode; variant?: 'default' | 'primary'; size?: 'md' | 'lg'; icon?: IconName | null;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; disabled?: boolean; type?: 'button' | 'submit'; title?: string; className?: string;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface SourceItem { id: string; label: React.ReactNode; icon?: IconName; badge?: React.ReactNode }
export interface SourceSection { title?: string; collapsible?: boolean; collapsed?: boolean; items: SourceItem[] }
export interface SourceListProps { sections: SourceSection[]; selected?: string; onSelect?: (id: string) => void; label?: string; className?: string }
export declare function SourceList(props: SourceListProps): React.ReactElement;

export interface AlbumGridProps { children?: React.ReactNode; label?: string; size?: number; className?: string }
export declare function AlbumGrid(props: AlbumGridProps): React.ReactElement;

export interface AlbumTileProps {
  art?: string; title?: React.ReactNode; subtitle?: React.ReactNode;
  state?: 'idle' | 'selected' | 'correct' | 'wrong' | 'hidden' | 'dimmed';
  playing?: boolean; onClick?: () => void; disabled?: boolean; size?: number; badgeLabel?: string; className?: string;
}
export declare function AlbumTile(props: AlbumTileProps): React.ReactElement;

export interface NowPlayingProps { label?: string; art?: string; title?: string; subtitle?: string; hidden?: boolean; className?: string }
export declare function NowPlaying(props: NowPlayingProps): React.ReactElement;

export interface LeaderboardPlayer {
  id: string; name: string; score: number; delta?: number; streak?: number;
  status?: 'guessing' | 'locked' | 'correct' | 'wrong' | 'away'; note?: string;
}
export interface LeaderboardProps { players: LeaderboardPlayer[]; highlight?: string; caption?: string; sort?: boolean; locale?: string; className?: string }
export declare function Leaderboard(props: LeaderboardProps): React.ReactElement;

export interface BadgeProps { children?: React.ReactNode; tone?: 'neutral' | 'aqua' | 'correct' | 'wrong' | 'gold'; icon?: IconName | null; className?: string }
export declare function Badge(props: BadgeProps): React.ReactElement;

export interface StatusBarProps { children?: React.ReactNode; start?: React.ReactNode; end?: React.ReactNode; className?: string }
export declare function StatusBar(props: StatusBarProps): React.ReactElement;

export interface BarButtonProps { icon: IconName; label: string; active?: boolean; onClick?: () => void; disabled?: boolean; className?: string }
export declare function BarButton(props: BarButtonProps): React.ReactElement;

declare global {
  interface Window {
    SongQuiz: {
      Window: typeof Window; Toolbar: typeof Toolbar; Transport: typeof Transport; TransportButton: typeof TransportButton;
      VolumeSlider: typeof VolumeSlider; LcdDisplay: typeof LcdDisplay; SegmentedControl: typeof SegmentedControl;
      SearchField: typeof SearchField; Button: typeof Button; SourceList: typeof SourceList; AlbumGrid: typeof AlbumGrid;
      AlbumTile: typeof AlbumTile; NowPlaying: typeof NowPlaying; Leaderboard: typeof Leaderboard; Badge: typeof Badge;
      StatusBar: typeof StatusBar; BarButton: typeof BarButton; Icon: typeof Icon;
      iconNames: IconName[]; formatTime: (seconds: number) => string;
    };
  }
}

export interface ChatEntry {
  id: string;
  kind: 'message' | 'guess' | 'event';
  author?: string;
  avatar?: string;
  text: React.ReactNode;
  /** ms since epoch */
  time: number;
  mine?: boolean;
  tone?: 'neutral' | 'correct' | 'reveal';
}
export interface ChatPanelProps {
  entries: ChatEntry[];
  onSend?: (text: string) => void;
  title?: string;
  placeholder?: string;
  icon?: IconName;
  disabled?: boolean;
  className?: string;
}
export declare function ChatPanel(props: ChatPanelProps): React.ReactElement;
export declare function ChatMessage(props: { entry: ChatEntry; now: number }): React.ReactElement;
export declare function Avatar(props: { name: string; src?: string }): React.ReactElement;
