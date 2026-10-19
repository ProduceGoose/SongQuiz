// Plays a round's effects (game/effects.ts) on the song's <audio> element. Speed is the element's
// playback rate, with the pitch going along. Sound and distortion run the element through the Web
// Audio API: distortion first, like a cheap speaker, then the filters. The graph is only built once
// a round needs it; from then on the element always plays through it, without effects by default.
//
// The Web Audio API only hears audio it may read: our own server's, or Apple's (which sends
// Access-Control-Allow-Origin: *). So the element loads songs with crossOrigin = 'anonymous'.
import type { AudioEffects } from '../types';
import { SPEED_RATES } from './effects';

/** A soft-clipping curve: the higher `amount`, the harder the crunch. */
function distortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 2048;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  return curve;
}

function filter(ctx: AudioContext, type: BiquadFilterType, frequency: number): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = frequency;
  return f;
}

function gain(ctx: AudioContext, value: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = value;
  return g;
}

function nodesFor(ctx: AudioContext, e: AudioEffects): AudioNode[] {
  const nodes: AudioNode[] = [];
  if (e.distort === 'on') {
    const shaper = ctx.createWaveShaper();
    shaper.curve = distortionCurve(40);
    shaper.oversample = '4x';
    nodes.push(shaper, gain(ctx, 0.5));
  }
  // Muffled: only the lows, as through a wall. Telephone: only a narrow middle band, a bit louder.
  if (e.tone === 'muffled') nodes.push(filter(ctx, 'lowpass', 450));
  if (e.tone === 'telephone') nodes.push(filter(ctx, 'highpass', 500), filter(ctx, 'lowpass', 2800), gain(ctx, 1.6));
  return nodes;
}

export class EffectChain {
  private ctx: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private nodes: AudioNode[] = [];

  constructor(private readonly audio: HTMLAudioElement) {}

  apply(e: AudioEffects) {
    const rate = SPEED_RATES[e.speed];
    // Both, since loading a new song resets the rate to the default one.
    this.audio.defaultPlaybackRate = rate;
    this.audio.playbackRate = rate;
    this.audio.preservesPitch = false;
    (this.audio as HTMLAudioElement & { webkitPreservesPitch?: boolean }).webkitPreservesPitch = false;

    const needsGraph = e.tone !== 'clean' || e.distort === 'on';
    if (!needsGraph && !this.ctx) return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.source = this.ctx.createMediaElementSource(this.audio);
    }
    this.source!.disconnect();
    for (const node of this.nodes) node.disconnect();
    this.nodes = nodesFor(this.ctx, e);
    let last: AudioNode = this.source!;
    for (const node of this.nodes) {
      last.connect(node);
      last = node;
    }
    last.connect(this.ctx.destination);
    void this.resume();
  }

  /**
   * Lets the graph make sound; browsers hold it until the person has clicked something. True if it
   * can play (or isn't needed).
   */
  async resume(): Promise<boolean> {
    const ctx = this.ctx;
    if (!ctx || ctx.state === 'running') return true;
    try {
      await ctx.resume();
    } catch {
      // Not allowed yet.
    }
    // Read again: resume() changes it.
    return (ctx.state as AudioContextState) === 'running';
  }

  close() {
    void this.ctx?.close();
  }
}
