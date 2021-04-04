import { SFZone } from './Zone';
import { centibel, centTone } from './runtime.types';
import { Shdr } from './pdta.types';
import { Note } from './runtime.types';
import { LUT } from './LUT';
import { Envelope } from './envAmplitue';
import { LFO } from './LFO';
import { RenderCtx } from './render-ctx';

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
  sampleData?: Float32Array;

  constructor(
    zone: SFZone,
    note: { key; velocity; channel?: number },
    sampleRate: RenderCtx | number
  ) {
    const sr =
      typeof sampleRate == 'number' ? sampleRate : sampleRate.sampleRate; //48000;
    this.zone = zone;
    this.staticLevels = {
      gainCB: zone.attenuate + LUT.velCB[note.velocity],

      pitch:
        note.key * 100 -
        zone.tuning -
        (zone.rootkey > -1 ? zone.rootkey : zone.sample.originalPitch) * 100 +
        Math.log2(zone.sample.sampleRate) * 1200 -
        Math.log2(sr) * 1200,
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
      ampVol.stages[0] + ampVol.stages[1] + ampVol.stages[2] + ampVol.stages[3];
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
    this.run = (steps: number) => {
      modVol.shift(steps);
      ampVol.shift(steps);
      const arates = {
        volume: LUT.getAmp(this.staticLevels.gainCB + ampVol.ampCB),

        pitch:
          LUT.relPC[~~(this.staticLevels.pitch - vibrLFO.pitchCent + 1200)],
        filter: 1,
      };

      return arates;
    };
    this.mods = { ampVol, modVol, modLFO, vibrLFO };
  }
  get smpl() {
    return this.sample;
  }
}
