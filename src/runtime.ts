import { SFZone } from './Zone';
import {
  cent2hz,
  centibel,
  centidb2gain,
  centTone,
  dbfs,
  stagesEnum,
} from './runtime.types';
import { Shdr } from './pdta.types';
import { Note } from './runtime.types';
import { RenderCtx } from './render-ctx';
import { LUT } from './LUT';
import { Envelope } from './envAmplitue';
import { LFO } from './LFO';

export class Runtime {
  staticLevels: {
    gainCB: centibel;
    pitch: centTone;
    filter: centTone;
    pan: { left: number; right: number };
  };
  run: (steps: number) => { volume: number; pitch: number; filter: number };
  mods: { ampVol; modVol; modLFO; vibrLFO };
  length: number;
  sample: Shdr;
  iterator: number;
  zone: SFZone;
  velocity: Number;
  channel: Number;
  constructor(zone: SFZone, { note, velocity, channel }, ctx: RenderCtx) {
    this.zone = zone;
    this.velocity = velocity;
    this.channel = channel;
    this.staticLevels = {
      gainCB:
        zone.attenuate + LUT.midiCB[note.velocity] * LUT.midiCB[note.velocity],

      pitch: calcPitchRatio(note, 48000, this.zone),
      filter: zone.lpf.cutoff,
      pan: {
        left: 0.5 - zone.pan / 1000,
        right: 0.5 + zone.pan / 1000,
      },
    };
    this.iterator = zone.sampleOffsets.start;
    const ampVol = new Envelope(zone.volEnv.phases, zone.volEnv.sustain);
    const modVol = new Envelope(zone.modEnv.phases, zone.modEnv.sustain);
    this.length =
      ampVol.stages[0] +
      ampVol.stages[1] +
      ampVol.stages[2] +
      ampVol.stages[3] +
      48000;
    this.sample = zone.sample;
    modVol.effects = zone.modEnv.effects;
    const modLFO = new LFO(
      zone.modLFO.delay,
      zone.modLFO.freq,
      zone.modLFO.effects
    );
    const vibrLFO = new LFO(
      zone.modLFO.delay,
      zone.modLFO.freq,
      zone.modLFO.effects
    );
    this.run = function (steps: number) {
      const arates = {
        volume: LUT.getAmp(
          this.staticLevels.gainCB +
            ampVol.ampCB +
            modLFO.amount * modLFO.effects.volume
        ),
        pitch:
          LUT.relPC[this.staticLevels.pitch + vibrLFO.effects.pitch + 1200],
        filter: cent2hz(
          this.staticLevels.filter +
            modVol.val * modVol.effects.filter +
            modLFO.val * modLFO.effects.filter
        ),
      };
      modLFO.shift(steps);
      modVol.shift(steps);
      vibrLFO.shift(steps);
      ampVol.shift(steps);
      return arates;
    };
    this.mods = { ampVol, modVol, modLFO, vibrLFO };
  }
  get smpl() {
    return this.sample;
  }
}
export default function calcPitchRatio(key, outputSampleRate, zone: SFZone) {
  const rootkey = zone.rootkey > -1 ? zone.rootkey : zone.sample.originalPitch;
  const samplePitch = rootkey * 100 + zone.tuning;
  const pitchDiff = (key * 100 - samplePitch) / 1200;
  const r =
    Math.pow(2, pitchDiff) * (zone.sample.sampleRate / outputSampleRate);
  return r;
}
