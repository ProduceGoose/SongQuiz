// Join: enter a room code and the name other players will see.
import { useState, type FormEvent } from 'react';
import { Button } from '@songquiz/ui';
import { Field } from '../components/form';
import { ScreenHeader, Sheet } from '../components/layout';
import type { ScreenDef, ScreenProps } from '../types';

function Join({ app }: ScreenProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState(app.settings.name);
  const [errors, setErrors] = useState<{ code?: string; name?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const n = name.trim();
    const next: typeof errors = {};
    if (!/^[A-Z0-9]{4}$/.test(c)) next.code = 'Enter the 4-character code from your host, like KX7Q.';
    if (!n) next.name = 'Enter the name other players will see.';
    setErrors(next);
    if (!next.code && !next.name) app.joinRoom(c, n);
  }

  return (
    <form className="app-screen" onSubmit={submit} noValidate>
      <ScreenHeader title="Join a room" hint="Ask the host for the room code. Try KX7Q for the demo room." />
      <Sheet title="Room details" className="app-narrow">
        <Field
          id="join-code" label="Room code" icon="broadcast" placeholder="KX7Q" maxLength={4} mono
          value={code} error={errors.code}
          onChange={(v) => { setCode(v.toUpperCase()); setErrors({}); }}
        />
        <Field
          id="join-name" label="Your name" icon="user" maxLength={20}
          value={name} error={errors.name} help="Shown in the lobby and on the scoreboard."
          onChange={(v) => { setName(v); setErrors({}); }}
        />
        {app.room ? <p className="app-help">Joining another room takes you out of {app.room.name}.</p> : null}
        <div className="app-sheet-actions">
          <Button size="lg" onClick={() => app.go('home')}>Cancel</Button>
          <Button variant="primary" size="lg" type="submit">Join room</Button>
        </div>
      </Sheet>
    </form>
  );
}

export const joinScreen: ScreenDef = {
  title: 'Join a room',
  Component: Join,
  lcd: () => ({ title: 'Join a room', subtitle: 'Waiting for a room code' }),
  status: () => 'Room codes have 4 letters or digits'
};
