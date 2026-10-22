// Plays a round's effects (game/effects.ts) on the song's <audio> element. Speed is the element's
// playback rate, with the pitch going along. The others run the element through the Web Audio API,
// one stage after another: distortion first, like a cheap speaker, then the filters, the delay and
// the reverb, so the echoes and the hall carry everything before them. The graph is only built once
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

/** A step of the chain: sound goes into `input` and comes out of `output`; `nodes` are all its parts. */
interface Stage {
  input: AudioNode;
  output: AudioNode;
  nodes: AudioNode[];
}

/** Nodes one after another, as a stage. */
function series(...nodes: AudioNode[]): Stage {
  for (let i = 1; i < nodes.length; i++) nodes[i - 1]!.connect(nodes[i]!);
  return { input: nodes[0]!, output: nodes[nodes.length - 1]!, nodes };
}

/** The song as it is (`dry`) plus the effect's sound (`wet`), each at its own level. */
function blend(ctx: AudioContext, effect: Stage, dry: number, wet: number): Stage {
  const input = gain(ctx, 1), output = gain(ctx, 1), dryLevel = gain(ctx, dry), wetLevel = gain(ctx, wet);
  input.connect(dryLevel).connect(output);
  input.connect(effect.input);
  effect.output.connect(wetLevel).connect(output);
  return { input, output, nodes: [input, output, dryLevel, wetLevel, ...effect.nodes] };
}

/** A big hall: stereo noise fading out over a few seconds, which the song is convolved with. */
function hall(ctx: AudioContext, seconds = 2.8): AudioBuffer {
  const length = Math.round(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  }
  return buffer;
}

function stagesFor(ctx: AudioContext, e: AudioEffects): Stage[] {
  const stages: Stage[] = [];
  if (e.distort === 'on') {
    const shaper = ctx.createWaveShaper();
    shaper.curve = distortionCurve(40);
    shaper.oversample = '4x';
    stages.push(series(shaper, gain(ctx, 0.5)));
  }
  // Muffled: only the lows, as through a wall. Telephone: only a narrow middle band, a bit louder.
  if (e.tone === 'muffled') stages.push(series(filter(ctx, 'lowpass', 450)));
  if (e.tone === 'telephone') stages.push(series(filter(ctx, 'highpass', 500), filter(ctx, 'lowpass', 2800), gain(ctx, 1.6)));
  if (e.delay === 'on') {
    // An echo every third of a second, each a bit quieter than the last.
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.33;
    const feedback = gain(ctx, 0.45);
    delay.connect(feedback).connect(delay);
    stages.push(blend(ctx, { input: delay, output: delay, nodes: [delay, feedback] }, 1, 0.6));
  }
  if (e.reverb === 'on') {
    const convolver = ctx.createConvolver();
    convolver.buffer = hall(ctx);
    stages.push(blend(ctx, series(convolver), 0.6, 0.9));
  }
  return stages;
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

    const needsGraph = e.tone !== 'clean' || e.distort === 'on' || e.reverb === 'on' || e.delay === 'on';
    if (!needsGraph && !this.ctx) return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.source = this.ctx.createMediaElementSource(this.audio);
    }
    this.source!.disconnect();
    // Every part, so a delay's feedback loop stops ringing too.
    for (const node of this.nodes) node.disconnect();
    const stages = stagesFor(this.ctx, e);
    this.nodes = stages.flatMap((s) => s.nodes);
    let last: AudioNode = this.source!;
    for (const stage of stages) {
      last.connect(stage.input);
      last = stage.output;
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
