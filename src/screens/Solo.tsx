// Solo: choose how to play on your own before the game opens. Free play is a room with only you;
// survival is a run with three lives through three levels of playlists (game/survival.ts). Both
// are offline.
import { Button } from '../components/controls/Button';
import { ScreenHeader, Sheet } from '../components/content/Layout';
import { bestRun } from '../game/bestRun';
import { LIVES, runText, SONGS_PER_STAGE, STAGES, SURVIVAL_RULES } from '../game/survival';
import { pointsText } from '../game/scoring';
import type { ScreenDef, ScreenProps } from '../types';

function Solo({ app }: ScreenProps) {
  const best = bestRun();
  return (
    <div className="app-screen">
      <ScreenHeader title="Play solo" hint="Just you and the music. Nothing goes to a server, so it works without one." />

      <div className="app-stack">
        <Sheet title="Free play">
          <p className="app-help">Pick any playlist, the rules and the effects, and play as many rounds as you like. Pause or skip whenever you want.</p>
          <div className="app-actions">
            <Button variant="primary" size="lg" icon="play" onClick={() => app.playSolo('casual')}>Start free play</Button>
          </div>
        </Sheet>

        <Sheet title="Survival">
          <p className="app-help">
            How far can you get? {SURVIVAL_RULES}. Up to {STAGES * SONGS_PER_STAGE} songs,
            no pausing, no skipping.
          </p>
          {best ? (
            <p className="app-help">
              Your best run: {runText(best)}, {pointsText(best.points)}.
            </p>
          ) : null}
          <div className="app-actions">
            <Button variant="primary" size="lg" icon="play" onClick={() => app.playSolo('coop')}>Start survival · {'♥'.repeat(LIVES)}</Button>
          </div>
        </Sheet>
      </div>
    </div>
  );
}

export const soloScreen: ScreenDef = {
  title: 'Play solo',
  Component: Solo,
  parent: 'home',
  lcd: () => ({ title: 'Play solo', subtitle: 'Free play or survival' }),
  status: () => 'Choose how to play on your own'
};
