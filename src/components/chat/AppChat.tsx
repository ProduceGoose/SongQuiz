// The room chat on the right of the window. While a round is playing, the field takes guesses.
import type { AppApi } from '../../types';
import { ChatPanel } from './ChatPanel';

export function AppChat({ app }: { app: AppApi }) {
  const playing = app.round?.phase === 'playing';
  return (
    <ChatPanel
      title="Room chat" entries={app.chat} onSend={app.sendChat}
      icon={playing ? 'music' : 'chat'}
      placeholder={playing ? 'Type your guess' : 'Message the room'}
    />
  );
}
