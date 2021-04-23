import { resolve } from 'node:dns';
import { SFZone, EnvParams, SampleData } from '../node_modules/parse-sf2/dist/';

const attenuate2gain = (cent: number) => Math.pow(10, cent / -200);
const centone2hz = (cent: number) => Math.pow(2, cent / 1200) * 8.176;
const centibel2regularamp = (centible: number) => Math.pow(10, centible / 200);
const centtime2sec = (centtime: number) => Math.pow(2, centtime / 1200);
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

export async function renderOffline(
  zone: SFZone,
  audioBuffer: AudioBuffer
): Promise<AudioBuffer> {
  return new Promise((resolve) => {
    const sr = zone.sample.sampleRate;
    const nchannels = zone.sample.sampleType == 4 ? 2 : 1;

    const ctx = new OfflineAudioContext(nchannels, 1 * sr, sr);
    const { triggerStart } = renderZone(ctx, zone, audioBuffer);
    triggerStart();
    ctx.startRendering();
    ctx.oncomplete = (e: OfflineAudioCompletionEvent) => {
      resolve(e.renderedBuffer);
    };
  });
}

type fn = () => void;
function applyEnvelope(
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
