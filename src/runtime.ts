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

  constructor(zone: SFZone, note: Note, ctx: RenderCtx) {
    this.zone = zone;
    this.staticLevels = {
      gainCB: zone.attenuate + LUT.midi2cb(note.velocity),

      pitch:
        note.key * 100 -
        zone.tuning -
        (zone.rootkey > -1 ? zone.rootkey : zone.sample.originalPitch) * 100 +
        Math.log2(zone.sample.sampleRate) * 1200 -
        Math.log2(ctx.sampleRate) * 1200,
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
        volume: LUT.getAmp(
          this.staticLevels.gainCB +
            ampVol.ampCB +
            modVol.egval * modVol.effects.volume
        ),

        pitch:
          LUT.relPC[
            ~~(
              this.staticLevels.pitch +
              modVol.modCenTune +
              modLFO.pitchCent +
              vibrLFO.pitchCent +
              1200
            )
          ],
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