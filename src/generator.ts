export class SFGenerator {
  constructor(private _operator: number, private valbyte: number) {}
  add(modgen: SFGenerator) {
    this.valbyte += modgen.valbyte;
  }
  get operator() {
    return this._operator;
  }
  get range() {
    return { lo: this.valbyte & 0x0f, hi: this.valbyte & 0xf0 };
  }
  get amount() {
    return this.valbyte; // | (this.hi << 8);
  }
  get signed() {
    return this.valbyte & 0x80 ? -0x10000 + this.valbyte : this.valbyte;
  }
}

const defaultValues = (sample) => {
  let sf_meta: any = {};
  /* set default generator values */

  sf_meta.start = sample.start;
  sf_meta.end = sample.dwEnd;
  sf_meta.loop_start = sample.dwStartloop;
  sf_meta.loop_end = sample.dwEndloop;
  sf_meta.key = sample.byOriginalKey;
  sf_meta.tune = sample.chCorrection;
  sf_meta.sustain_mod_env = 0;
  sf_meta.mod_env_to_pitch = 0;

  sf_meta.delay_vol_env = -12000;
  sf_meta.attack_vol_env = -12000;
  sf_meta.hold_vol_env = -12000;
  sf_meta.decay_vol_env = -12000;
  sf_meta.release_vol_env = -12000;
  sf_meta.sustain_level = 250;

  sf_meta.delayModEnv = -12000;
  sf_meta.attackModEnv = -12000;
  sf_meta.holdModEnv = -12000;
  sf_meta.decayModEnv = -12000;
  sf_meta.releaseModEnv = -12000;

  sf_meta.pan = 0;
  sf_meta.keyscale = 100;
  sf_meta.keymin = 0;
  sf_meta.keymax = 127;
  sf_meta.velmin = 0;
  sf_meta.velmax = 127;
  sf_meta.mode = 0;
  /* I added the following. (gl) */
  sf_meta.instrument_unused5 = -1;
  sf_meta.exclusiveClass = 0;
  sf_meta.initialAttenuation = 0;
  sf_meta.chorusEffectsSend = 0;
  sf_meta.reverbEffectsSend = 0;
  sf_meta.modLfoToPitch = 0;
  sf_meta.vibLfoToPitch = 0;
  sf_meta.keynum = -1;
  sf_meta.velocity = -1;
  sf_meta.keynumToModEnvHold = 0;
  sf_meta.keynumToModEnvDecay = 0;
  sf_meta.keynumToVolEnvHold = 0;
  sf_meta.keynumToVolEnvDecay = 0;
  sf_meta.modLfoToVolume = 0;
  sf_meta.delayModLFO = 0;
  sf_meta.freqModLFO = 0;
  sf_meta.delayVibLFO = 0;
  sf_meta.freqVibLFO = 0;
  sf_meta.initialFilterQ = 0;
  sf_meta.initialFilterFc = 0;
  sf_meta.modEnvToFilterFc = 0;
  sf_meta.modLfoToFilterFc = 0;
  return sf_meta;
};
