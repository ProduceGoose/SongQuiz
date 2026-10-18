// Plays the round's song preview, in step with everyone else: it starts at the round's start
// point plus the time since the round began, so someone joining mid-round hears the same moment.
// The song keeps playing through the reveal and stops when the game ends.
//
// Browsers only allow sound after the person has clicked something. Most players click "I'm
// ready" or "Start game" first; if the browser still blocks it, `blocked` is set and the next
// click anywhere starts the song.
import { useEffect, useRef, useState } from 'react';
import type { Round, Snippet } from '../types';
import { PREVIEW_SECONDS } from './preview';

/** Half a second of silence, played on the first click so the browser allows sound later. */
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

const absolute = (src: string) => new URL(src, location.href).href;

export function useSnippet(round: Round | null, volume: number): Snippet {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const pausedByYou = useRef(false);
  const latest = useRef(round);
  latest.current = round;

  if (!audioRef.current && typeof Audio !== 'undefined') {
    const a = new Audio();
    a.preload = 'auto';
    a.onplaying = () => setPlaying(true);
    a.onpause = () => setPlaying(false);
    a.onended = () => setPlaying(false);
    audioRef.current = a;
  }
  const audio = audioRef.current;

  /** Plays from where the round is now. */
  function sync() {
    const r = latest.current;
    if (!audio || !r?.audio || pausedByYou.current) return;
    const { offset } = r.audio;
    const start = () => {
      // Measured after loading, so the time spent loading is skipped too.
      const at = offset + (Date.now() - r.startedAt) / 1000;
      if (at >= PREVIEW_SECONDS - 0.25) {
        audio.pause();
        return;
      }
      audio.currentTime = Math.max(offset, at);
      audio.play().then(() => setBlocked(false), (err: DOMException) => {
        if (err.name === 'NotAllowedError') setBlocked(true);
      });
    };
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) start();
    else audio.addEventListener('loadedmetadata', start, { once: true });
  }

  // A new round (or its audio arriving): load it and play from the right moment.
  const src = round?.audio?.src;
  useEffect(() => {
    if (!audio) return;
    if (!src) {
      audio.pause();
      return;
    }
    pausedByYou.current = false;
    if (audio.src !== absolute(src)) audio.src = src;
    sync();
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  // The game ended.
  const inGame = !!round;
  useEffect(() => {
    if (!inGame) audio?.pause();
  }, [inGame]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load the next round's song during the reveal, so it starts without a gap.
  const next = round?.nextAudio;
  useEffect(() => {
    if (!next) return;
    const ahead = new Audio();
    ahead.preload = 'auto';
    ahead.src = next;
    return () => ahead.removeAttribute('src');
  }, [next]);

  useEffect(() => {
    if (audio) audio.volume = Math.max(0, Math.min(1, volume / 100));
  }, [audio, volume]);

  // The first click on the page unlocks sound; while blocked, any click starts the song.
  useEffect(() => {
    if (!audio) return;
    const onClick = () => {
      if (latest.current?.audio) sync();
      else if (!audio.src) {
        audio.src = SILENCE;
        audio.play().then(() => audio.pause(), () => undefined);
      }
    };
    document.addEventListener('pointerdown', onClick, { once: !blocked });
    return () => document.removeEventListener('pointerdown', onClick);
  }, [audio, blocked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop for good when the page closes.
  useEffect(() => () => audio?.pause(), [audio]);

  return {
    available: !!round?.audio,
    playing,
    blocked,
    toggle() {
      if (!audio || !round?.audio) return;
      if (playing) {
        pausedByYou.current = true;
        audio.pause();
      } else {
        pausedByYou.current = false;
        sync();
      }
    },
    replay() {
      if (!audio || !round?.audio) return;
      pausedByYou.current = false;
      audio.currentTime = round.audio.offset;
      audio.play().then(() => setBlocked(false), () => setBlocked(true));
    }
  };
}
