import { SFZone } from './Zone';
import {
  cent2hz,
  centibel,
  centidb2gain,
  centime,
  centTone,
  dbfs,
  ModEffects,
  stagesEnum,
} from './runtime.types';
import { Shdr } from './pdta';
import { Note, Ctx } from './runtime.types';
import { tc2ms } from './timecent2ms';
import { RenderCtx } from './render-ctx';
import { SF2File } from './sffile';
type runFunction = (
  steps: number
) => { volume: number; pitch: number; filter: number };
type ZoneDescriptor = any;

export class Runtime {
  staticLevels: {
    gainCB: centibel;
    pitch: centTone;
    filter: centTone;
    pan: { left: number; right: number };
  };
  run: (steps: number) => { volume: number; pitch: number; filter: number };
  mods: any;
  length: number;
  sample: Shdr;
  iterator: number;

  constructor(zone: SFZone, note: Note, ctx: RenderCtx) {
    this.staticLevels = {
      gainCB:
        zone.attenuate +
        (-200.0 / 960) *
          Math.log10((note.velocity * note.velocity) / (127 * 127)),
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
      const arates = {
        volume: centidb2gain(this.staticLevels.gainCB - (960 - ampVol.ampCB)),
        pitch: Math.pow(
          2,
          (this.staticLevels.pitch +
            modLFO.val * modLFO.effects.pitch +
            vibrLFO.val * vibrLFO.effects.pitch +
            modVol.gain * modVol.effects.pitch) /
            1200
        ),
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

export class LFO {
  sampleRate: number = 48000;
  amount: number = 0;
  delta: number;
  delay: number;
  cycles: number = 0;
  effects: ModEffects;
  constructor(
    delay: number,
    freq: centTone,
    effects: ModEffects,
    sampleRate: number = 48000
  ) {
    this.sampleRate = sampleRate;
    this.delta = (4.0 * cent2hz(freq)) / sampleRate; //covering distance of 1/4 4 times per cycle..
    this.delay = delay < -12000 ? 0 : Math.pow(2, delay / 1200) * sampleRate;
    this.effects = effects;
  }
  static fromJSON(str: string) {
    const obj = JSON.parse(str);
    return new LFO(obj.delay, obj.freq, obj.effects);
  }
  shift(steps: number = 1) {
    while (steps-- > 0) {
      if (this.delay-- > 0) continue;
      this.amount += this.delta;
      if (this.amount >= 1 || this.amount <= -1) {
        this.delta = -1 * this.delta;
        this.cycles++;
      }
    }
    return this.amount;
  }
  get val() {
    return this.amount;
  }
}

export class Envelope {
  effects: ModEffects;
  state: {
    stage: number;
    stageStep: number;
  } = {
    stage: 0,
    stageStep: 0,
  };
  sr: number;
  stages: number[] = [];
  deltas: number[];
  keyOff: boolean = false;
  ampCB: number;
  modifier: number;
  constructor(phases: any, sustainCB: centibel, sampleRate: number = 48000) {
    const { delay, attack, hold, decay, release } = phases;
    this.stages = [delay, attack, hold, decay, release]
      .map((centime) => Math.pow(2, centime / 1200) * sampleRate)
      .map((t) => Math.max(1, t));
    const amts = [0, 0, dbfs, dbfs, dbfs - sustainCB, 0];
    // const { delay, attack, hold, decay, release, done } = stagesEnum;
    this.deltas = [
      0,
      dbfs / this.stages[1],
      0,
      -sustainCB / this.stages[3],
      -dbfs / this.stages[4],
      0,
    ];
    this.ampCB = 0;
  }
  get done() {
    return this.ampCB < -10 || this.state.stage == stagesEnum.done;
  }
  get val() {
    return this.ampCB;
  }
  shift(steps: number) {
    if (this.state.stage === stagesEnum.done) return 0;
    while (steps > 0) {
      this.state.stageStep++;
      steps--;
      this.ampCB += this.deltas[this.state.stage];
      if (this.state.stageStep >= this.stages[this.state.stage]) {
        this.state.stage++;
        this.state.stageStep = 0;
      }
    }
  }
  get gain() {
    return Math.pow(10, (1 - this.val) / 200);
  }
  get stage() {
    return this.state.stage;
  }
  *iterator() {
    if (this.done) return 0;
    else yield this.val;
  }
  triggerRelease() {
    if (this.state.stage < stagesEnum.release) {
      this.state.stage = stagesEnum.release;
      this.state.stageStep = 0;
      this.stages[stagesEnum.release] =
        this.ampCB / this.deltas[stagesEnum.release];
    }
  }
}
