// Survival's slot machine: before each new playlist, a reel of playlist covers spins and stops on
// the one the run picked (Round.spin, set by game/useGame.ts). On a level's last playlist a second
// reel spins its effects. Once both have stopped, the player starts the playlist. It covers the
// window until then.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Button } from '../components/controls/Button';
import { playlistById } from '../data/demo';
import { hearts, PLAYLISTS_PER_LEVEL } from '../game/survival';
import type { Round } from '../types';
import './SlotMachine.css';

/** Height of a cover on the reel and of an effect name, in px; they match SlotMachine.css. */
const TILE = 128;
const LINE = 28;
/** The effects reel stops this much after the covers, so each stop gets its moment. */
const EFFECTS_LAG_MS = 700;

const stillMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Turns a reel from its first item to its last in `ms`, slowing down like a real one. */
function spinTo(el: HTMLElement | null, items: number, size: number, ms: number) {
  if (!el) return;
  el.style.transition = 'none';
  el.style.transform = 'translateY(0)';
  void el.offsetHeight;
  el.style.transition = `transform ${ms}ms cubic-bezier(.12, .7, .16, 1)`;
  el.style.transform = `translateY(${-(items - 1) * size}px)`;
}

export function SlotMachine({ round, onStart }: { round: Round; onStart: () => void }) {
  const { reel, until, effects } = round.spin!;
  const run = round.run!;
  const covers = useRef<HTMLDivElement>(null);
  const names = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState(false);

  useLayoutEffect(() => {
    setLanded(false);
    const still = stillMotion();
    const ms = still ? 0 : Math.max(0, until - Date.now());
    const lag = still || !effects ? 0 : EFFECTS_LAG_MS;
    spinTo(covers.current, reel.length, TILE, ms);
    if (effects) spinTo(names.current, effects.length, LINE, ms + lag);
    const timer = window.setTimeout(() => setLanded(true), ms + lag);
    return () => window.clearTimeout(timer);
  }, [round.number]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enter or Space starts the playlist once the reels stop.
  useEffect(() => {
    if (landed) box.current?.querySelector<HTMLButtonElement>('.sq-btn')?.focus();
  }, [landed]);

  const picked = playlistById(reel[reel.length - 1]);
  const effectText = effects?.[effects.length - 1];
  return (
    <div className="app-slot" role="dialog" aria-modal="true" aria-label="The next playlist">
      <div className="app-slot-machine" ref={box}>
        <div className="app-slot-head">
          <span className="app-slot-level">{run.level}</span>
          <span>Playlist {run.levelStage} of {PLAYLISTS_PER_LEVEL}</span>
          <span className="app-slot-lives" aria-label={`${run.lives} lives left`}>{hearts(run.lives)}</span>
        </div>
        <Reel strip={covers} className="app-slot-window" landed={landed}>
          {reel.map((id, i) => <img key={i} className="app-slot-tile" src={playlistById(id).art} alt="" />)}
        </Reel>
        {effects ? (
          <Reel strip={names} className="app-slot-window is-effects" landed={landed}>
            {effects.map((text, i) => <span key={i} className="app-slot-effect">{text}</span>)}
          </Reel>
        ) : null}
        <div className="app-slot-caption" aria-live="polite">
          {landed ? (
            <>
              <strong>{picked.title}</strong> · its {run.level.toLowerCase()} songs
              {effectText ? <><br />Effects: <strong>{effectText}</strong></> : null}
            </>
          ) : 'Spinning…'}
        </div>
        {/* Rendered all along so the dialog keeps its size; usable once the reels stop. */}
        <Button variant="primary" size="lg" icon="play" disabled={!landed} onClick={onStart}>
          Start
        </Button>
      </div>
    </div>
  );
}

function Reel({ strip, className, landed, children }: { strip: RefObject<HTMLDivElement>; className: string; landed: boolean; children: ReactNode }) {
  return (
    <div className={landed ? `${className} is-landed` : className}>
      <div className="app-slot-strip" ref={strip}>{children}</div>
    </div>
  );
}
