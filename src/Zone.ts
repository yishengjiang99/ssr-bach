import {
  LFO,
  Envelope,
  centibel,
  LOOPMODES,
  cent2hz,
  centidb2gain,
  timecent2sec,
} from './centTone';
import { SFGenerator } from './generator';
import { Shdr } from './pdta';
import { sf_gen_id } from './sf.types';

export class SFZone {
  keyRange: { lo: number; hi: number } = { lo: 0, hi: 127 };
  velRange: { lo: number; hi: number } = { lo: 0, hi: 127 };
  sampleOffsets: Partial<Shdr> = {
    start: 0,
    end: 0,
    startLoop: 0,
    endLoop: 0,
  };
  modLFO = new LFO();
  vibrLFO = new LFO();
  modEnv = new Envelope();
  volEnv = {
    phases: {
      decay: -12000,
      attack: -12000,
      delay: 0,
      release: -3000,
      hold: -12000,
    },
    sustain: 300,
  };
  lpf: { cutoff: number; q: number } = { cutoff: 0, q: 1 };
  chorus: number = 0; /* chrous web %/10 */
  reverbSend: number = 0; /* percent of signal to send back.. in 0.1% units*/
  pan: number = 0; /* shift to right percent */
  attenuate: centibel = 0 /*db in attentuation*/;
  instrumentID: number = -1;
  pitch: number = 60;
  sampleMode: LOOPMODES = LOOPMODES.CONTINUOUS_LOOP;
  sampleID: number;
  generators: SFGenerator[] = [];
  shdr: Shdr = null;

  set sample(shdr: Shdr) {
    this.shdr = shdr;
    this.sampleOffsets.start += shdr.start;
    this.sampleOffsets.end += shdr.end;
    this.sampleOffsets.startLoop += shdr.endLoop;
    this.sampleOffsets.endLoop += shdr.endLoop;
    this.pitch = shdr.originalPitch * 100 + shdr.pitchCorrection;
  }
  get sample() {
    return {
      ...this.shdr,
      ...this.sampleOffsets,
    };
  }

  applyGenVal(gen: SFGenerator): void {
    switch (gen.operator) {
      case startAddrsOffset:
        this.sampleOffsets.start += gen.s16;
        break;
      case endAddrsOffset:
        this.sampleOffsets.end += gen.s16;
        break;
      case startloopAddrsOffset:
        this.sampleOffsets.startLoop += gen.s16;
        break;
      case endloopAddrsOffset:
        this.sampleOffsets.endLoop += gen.s16;
        break;
      case startAddrsCoarseOffset:
        this.sampleOffsets.start += 15 << gen.s16;
        break;
      case modLfoToPitch:
        this.modLFO.effects.pitch = cent2hz(gen.s16);
        break;
      case vibLfoToPitch:
        this.vibrLFO.effects.pitch = cent2hz(gen.s16);
        break;
      case modEnvToPitch:
        this.modEnv.effects.pitch = cent2hz(gen.s16);
        break;

      case initialFilterFc:
        this.lpf.cutoff = cent2hz(gen.s16);
        break;
      case initialFilterQ:
        this.lpf.q = cent2hz(gen.s16);
        break;
      case modLfoToFilterFc:
        this.modLFO.effects.filter = cent2hz(gen.s16);
        break;

      case modEnvToFilterFc:
        this.modEnv.effects.filter = cent2hz(gen.s16);
        break;
      case endAddrsCoarseOffset:
        this.sampleOffsets.end += 15 << gen.s16;
        break;
      case modLfoToVolume:
        this.modLFO.effects.volume = centidb2gain(gen.s16);
        break;
      case unused1:
      case chorusEffectsSend:
        this.chorus = gen.s16;
        break;
      case reverbEffectsSend:
        this.reverbSend = gen.s16;

        break;
      case pan:
        this.pan = gen.s16;
        break;
      case unused2:
      case unused3:
      case unused4:
        break;
      case delayModLFO:
        this.modLFO.delay = gen.s16;
        break;
      case freqModLFO:
        this.modLFO.freq = gen.s16;
        break;

      case delayVibLFO:
        this.vibrLFO.delay = gen.s16;
        break;

      case freqVibLFO:
        this.vibrLFO.freq = gen.s16;
        break;
      case delayModEnv:
        this.modEnv.phases.delay = timecent2sec(gen.s16);
        break;

      case attackModEnv:
        this.modEnv.phases.attack = timecent2sec(gen.s16);
        break;
      case holdModEnv:
        this.modEnv.phases.attack = timecent2sec(gen.s16);
        break;
      case decayModEnv:
        this.modEnv.phases.decay = timecent2sec(gen.s16);
        break;

      case sustainModEnv /* percent of fullscale*/:
        this.modEnv.sustain = gen.s16;
        break;

      case releaseModEnv:
        this.modEnv.phases.release = timecent2sec(gen.s16);
        break;
      case keynumToModEnvHold:
      case keynumToModEnvDecay:
        break;
      case delayVolEnv:
        this.volEnv.phases.delay = timecent2sec(gen.s16);
        break;

      case attackVolEnv /*This is the time, in absolute timecents, from the end of the Volume
      Envelope Delay Time until the point at which the Volume Envelope
      value reaches its peak. Note that the attack is “convex”; the curve is
      nominally such that when applied to the decibel volume parameter, the
      result is linear in amplitude. A value of 0 indicates a 1 second attack
      time. A negative value indicates a time less than one second; a positive
      value a time longer than one second. The most negative number (-
      32768) conventionally indicates instantaneous attack. For example, an
      attack time of 10 msec would be 1200log2(.01) = -7973.*/:
        this.volEnv.phases.attack = gen.s16;
        break;

      case holdVolEnv:
        this.volEnv.phases.hold = gen.s16;
        break;

      case decayVolEnv:
        this.volEnv.phases.decay = gen.s16; //timecent2sec(gen.s16);
        break;

      case sustainVolEnv /** \']
      
      http://www.synthfont.com/SFSPEC21.PDF  is the decrease in level, expressed in centibels, to which the
      Volume Envelope value ramps during the decay phase. For the Volume
      Envelope, the sustain level is best expressed in centibels of attenuation
      from full scale. A value of 0 indicates the sustain level is full level; this
      implies a zero duration of decay phase regardless of decay time. A
      positive value indicates a decay to the corresponding level. Values less
      than zero are to be interpreted as zero; conventionally 1000 indicates
      full attenuation. For example, a sustain level which corresponds to an
absolute value 12dB below of peak would be 120. */:
        this.volEnv.sustain = (960 - gen.s16) / 960;
        break;

      /*This is the time, in absolute timecents, for a 100% change in the
Volume Envelope value during release phase. For the Volume
Envelope, the release phase linearly ramps toward zero from the current
level, causing a constant dB change for each time unit. If the current
level were full scale, the Volume Envelope Release Time would be the
time spent in release phase until 100dB attenuation were reached. A
value of 0 indicates a 1-second decay time for a release from full level.
SoundFont 2.01 Technical Specification - Page 45 - 08/05/98 12:43 PM
A negative value indicates a time less than one second; a positive value
a time longer than one second.  http://www.synthfont.com/SFSPEC21.PDF For example, . For example, a release time of 10 msec
would be 1200log2(.01) = -7973. */
      case releaseVolEnv:
        this.volEnv.phases.release = gen.s16; //timecent2sec(gen.s16);
        break;

      case keynumToVolEnvHold:
      case keynumToVolEnvDecay:
        break;
      case instrument:
        this.instrumentID = gen.s16;
        break;
      case reserved1:
        break;
      case keyRange:
        this.keyRange = gen.range;
        break;
      case velRange:
        this.velRange = gen.range;
        break;
      case startloopAddrsCoarse:
        this.sampleOffsets.startLoop += 15 << gen.s16;
        break;
      case keynum:
      case velocity:
      case initialAttenuation:
        this.attenuate = centidb2gain(gen.s16);
        break;
      case reserved2:
      case endloopAddrsCoarse:
        this.sampleOffsets.endLoop += 15 << gen.s16;
        break;
      case coarseTune:
        this.pitch += gen.s16 * 100; //semitone
        break;
      case fineTune:
        this.pitch += gen.s16; //tone
        break;

      case sampleID:
        this.sampleID = gen.s16;
      case sampleModes:
        break;
      case reserved3:
        break;
      case scaleTuning:
        break;
      case exclusiveClass:
      case overridingRootKey:
        if (gen.s16 > -1) this.pitch = gen.s16;
        break;
      case unused5:
      case endOper:
        break;
      default:
        throw 'unexpected operator';
    }
    this.generators.push(gen);
  }
}

const {
  startAddrsOffset,
  endAddrsOffset,
  startloopAddrsOffset,
  endloopAddrsOffset,
  startAddrsCoarseOffset,
  modLfoToPitch,
  vibLfoToPitch,
  modEnvToPitch,
  initialFilterFc,
  initialFilterQ,
  modLfoToFilterFc,
  modEnvToFilterFc,
  endAddrsCoarseOffset,
  modLfoToVolume,
  unused1,
  chorusEffectsSend,
  reverbEffectsSend,
  pan,
  unused2,
  unused3,
  unused4,
  delayModLFO,
  freqModLFO,
  delayVibLFO,
  freqVibLFO,
  delayModEnv,
  attackModEnv,
  holdModEnv,
  decayModEnv,
  sustainModEnv,
  releaseModEnv,
  keynumToModEnvHold,
  keynumToModEnvDecay,
  delayVolEnv,
  attackVolEnv,
  holdVolEnv,
  decayVolEnv,
  sustainVolEnv,
  releaseVolEnv,
  keynumToVolEnvHold,
  keynumToVolEnvDecay,
  instrument,
  reserved1,
  keyRange,
  velRange,
  startloopAddrsCoarse,
  keynum,
  velocity,
  initialAttenuation,
  reserved2,
  endloopAddrsCoarse,
  coarseTune,
  fineTune,
  sampleID,
  sampleModes,
  reserved3,
  scaleTuning,
  exclusiveClass,
  overridingRootKey,
  unused5,
  endOper,
} = sf_gen_id;