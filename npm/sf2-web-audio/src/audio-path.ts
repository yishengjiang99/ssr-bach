import {
  SFZone,
  SF2File,
  EnvParams,
  SampleData,
} from '../node_modules/parse-sf2/bundle.js';
import {
  centone2hz,
  centibel2regularamp,
  attenuate2gain,
  centtime2sec,
} from './math.js';
import { InputStream, resolveBuffer } from './resolve-buffer-source.js';

export class SynthChannel {
  ctx: BaseAudioContext;
  preamp: GainNode;
  lpf: BiquadFilterNode;
  modLFO: OscillatorNode;
  ampVol: GainNode;
  program: number[] = [0, 0];
  sffile: SF2File;
  sampleData: SampleData;
  inputs: InputStream[];

  constructor(ctx: BaseAudioContext, sffile: SF2File) {
    this.ctx = ctx;
    this.sffile = sffile;
    this.sampleData = new SampleData(sffile.sdta.data);
    this.preamp = new GainNode(ctx, { gain: 1 });
    this.ampVol = new GainNode(ctx, { gain: 0 });
    this.lpf = new BiquadFilterNode(ctx, { type: 'lowpass' });
    this.modLFO = new OscillatorNode(ctx, { type: 'triangle', frequency: 60 });
    this.inputs = [];
    this.ampVol.connect(this.preamp).connect(this.lpf).connect(ctx.destination);
  }
  setProgram(presetId: number, bankId = 0) {
    this.program = [presetId, bankId];
  }

  keyOn(key: number, vel: number, when: number) {
    this.sffile.pdta
      .findPreset(this.program[0], this.program[0], key, vel)
      .map((z: SFZone) => {
        this.inputs.push();
        const input = new InputStream(this.ctx);
        input.iterator = this.sampleData.sampleBuffer(z, 1, 48000 * 2);
        input.scriptNode.connect(this.ampVol);
      });
  }

  keyOff(key: any, vels: any) {
    this.sffile;
  }
}
function passthrough(ctx: BaseAudioContext) {
  return ctx.createGain();
}
export function renderZone(
  ctx: BaseAudioContext,
  zone: SFZone,
  audb: AudioBuffer
): {
  components: any;
  triggerStart: (when?: number, duration?: number) => void;
  triggearRelease: (when?: number) => void;
} {
  const panner =
    zone.pan > -1
      ? new StereoPannerNode(ctx, { pan: 0.5 + zone.pan / 100 })
      : passthrough(ctx);
  const lpf = new BiquadFilterNode(ctx, {
    frequency: centone2hz(zone.lpf.cutoff),
    Q: centibel2regularamp(zone.lpf.q),
  });
  const preamp = new GainNode(ctx, { gain: attenuate2gain(zone.attenuate) });

  const modLFO = new OscillatorNode(ctx, {
    type: 'triangle',
    frequency: centone2hz(zone.modLFO.freq),
  });
  modLFO.connect(lpf.detune);

  const audbSource = new AudioBufferSourceNode(ctx, { buffer: audb });
  audbSource.loop = true;
  audbSource.loopStart = zone.sample.startLoop - zone.sample.start;
  audbSource.loopEnd = zone.sample.endLoop - zone.sample.start;

  const envelopeGain: GainNode = new GainNode(ctx, { gain: 0 });

  audbSource
    .connect(preamp)
    .connect(lpf)

    .connect(ctx.destination);

  const triggers: {
    onStarts: fn[];
    onReleases: fn[];
  } = {
    onStarts: [],
    onReleases: [],
  };
  applyEnvelope(zone.volEnv, envelopeGain.gain, ctx, triggers);

  if (zone.modEnv.effects.filter > 0) {
    applyEnvelope(zone.modEnv, lpf.detune, ctx, triggers);
  }
  function triggerStart(when?: number, duration?: number) {
    if (duration && when) audbSource.start(when, 0, duration);
    else if (when) {
      audbSource.start(when);
    } else {
      audbSource.start();
    }
    triggers.onStarts.forEach((fn) => fn());
  }

  return {
    components: {
      audbSource,
      lpf,
      panner,
      preamp,
    },
    triggerStart,
    triggearRelease: () => {
      audbSource.stop();
    },
  };
}

export type fn = () => void;
export function applyEnvelope(
  envelope: EnvParams,
  target: AudioParam,
  ctx: BaseAudioContext,
  triggers: {
    onStarts: fn[];
    onReleases: fn[];
  }
) {
  const normalizedSustain = 1 - envelope.sustain / 1000;

  const { delay, attack, decay, release } = envelope.phases;
  const rates = [delay, attack, decay, release].map((v) => centtime2sec(v));
  triggers.onStarts.push(() => {
    target.exponentialRampToValueAtTime(
      1,
      ctx.currentTime + rates[0] + rates[1]
    );
    target.exponentialRampToValueAtTime(
      attenuate2gain(normalizedSustain),
      ctx.currentTime + rates[0] + rates[1] + rates[2] + rates[3]
    );
  });
  triggers.onReleases.push(() => {
    target.cancelAndHoldAtTime(ctx.currentTime);
    target.exponentialRampToValueAtTime(0.00001, (target.value / 1) * rates[4]);
  });
}
