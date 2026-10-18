// The LCD in the app's toolbar: a message flashed by an action (app.flash),
// otherwise the two lines the current screen asks for (ScreenDef.lcd).
import { Icon } from '../controls/Icon';
import { LcdDisplay } from './LcdDisplay';
import type { AppApi, LcdText, ScreenDef } from '../../types';

export interface AppLcdProps {
  app: AppApi;
  screen: ScreenDef;
  /** A flashed message; shown instead of the screen's text while set. */
  message: LcdText | null;
}

export function AppLcd({ app, screen, message }: AppLcdProps) {
  const { title, subtitle } = message ?? screen.lcd(app);
  const { room } = app;
  return (
    <LcdDisplay
      title={title} subtitle={subtitle}
      start={<Icon name="music" size={14} />}
      end={room ? <Icon name="users" size={14} title={`${room.players.length} players in your room`} /> : null}
    />
  );
}
