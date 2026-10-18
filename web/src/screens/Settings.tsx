// Profile & settings: display name, theme, volume and album-art preference.
import { useState, type FormEvent } from 'react';
import { Button, SegmentedControl, VolumeSlider } from '@songquiz/ui';
import { Field, Setting } from '../components/form';
import { ScreenHeader, Sheet } from '../components/layout';
import type { ScreenDef, ScreenProps, Settings as SettingsType, Theme } from '../types';

function Settings({ app }: ScreenProps) {
  const { settings } = app;
  const [name, setName] = useState(settings.name);
  const [error, setError] = useState<string | null>(null);

  function saveName(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      setError('Your name can’t be empty.');
      return;
    }
    app.updateSettings({ name: n });
    app.flash('Name saved', `Other players will see “${n}”`);
  }

  return (
    <div className="app-screen">
      <ScreenHeader align="left" title="Profile & settings" hint="Saved in this browser only." />
      <div className="app-columns is-even">
        <Sheet title="Profile">
          <form className="app-stack" onSubmit={saveName} noValidate>
            <Field
              id="settings-name" label="Display name" icon="user" maxLength={20}
              value={name} error={error} help="Shown in lobbies and on the scoreboard."
              onChange={(v) => { setName(v); setError(null); }}
            />
            <div className="app-sheet-actions">
              <Button type="submit">Save name</Button>
            </div>
          </form>
        </Sheet>

        <Sheet title="Sound & display">
          <Setting label="Theme" hint="System follows your device.">
            <SegmentedControl
              label="Theme" value={settings.theme}
              onChange={(v) => app.updateSettings({ theme: v as Theme })}
              options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Aqua' }, { value: 'dark', label: 'Graphite' }]}
            />
          </Setting>
          <Setting label="Volume" hint={`${settings.volume}%`}>
            <VolumeSlider value={settings.volume} onChange={(v) => app.updateSettings({ volume: v })} />
          </Setting>
          <Setting label="Album art in rounds" hint="Hiding it makes cover rounds harder.">
            <SegmentedControl
              label="Album art in rounds" value={settings.covers}
              onChange={(v) => app.updateSettings({ covers: v as SettingsType['covers'] })}
              options={[{ value: 'on', label: 'Show' }, { value: 'off', label: 'Hide' }]}
            />
          </Setting>
          <div className="app-sheet-actions">
            <Button onClick={app.resetPrototype}>Reset prototype</Button>
          </div>
        </Sheet>
      </div>
    </div>
  );
}

export const settingsScreen: ScreenDef = {
  title: 'Profile & settings',
  Component: Settings,
  lcd: (app) => ({ title: 'Profile & settings', subtitle: 'Playing as ' + app.settings.name }),
  status: () => 'Settings are saved in this browser'
};
