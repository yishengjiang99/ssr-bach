import { envAmplitue } from './envAmplitue';
import { SFGenerator, GenRange } from './generator';
import { LUT } from './LUT';
import { Shdr } from './pdta';
import { sf_gen_id as sfg, adsrParams, adsrModParams } from './sf.types';

export type Zone = {
  velRange: GenRange;
  keyRange: GenRange;
  envelope: Generator<number, number, Error>;
  misc?: any;
  sample: Shdr;
  pan?: number;
  attenuation?: number;
  pitchAdjust: (key: number) => number;
  gain: (noteVelocity: number, channelVol: number, masterVol: number) => number;
};
export function presetZone(
  igenSet: Record<number, SFGenerator>,
  pgenSet: Record<number, SFGenerator>,
  shdr: Shdr[]
): Zone {
  function genval(genId: sfg): number {
    if (!pgenSet[genId] && !igenSet[genId])
      return SFGenerator.defaultValue(genId);
    if (!igenSet[genId] && pgenSet[genId]) return pgenSet[genId].s16;
    if (igenSet[genId] && pgenSet[genId])
      return igenSet[genId].s16 + pgenSet[genId].s16;
    if (igenSet[genId] && !pgenSet[genId]) return igenSet[genId].s16;
  }
  function getSFRange(genId: sfg.velRange | sfg.keyRange) {
    const instRange = igenSet[genId]?.range || { lo: 0, hi: 127 };
    const prange = pgenSet[genId]?.range || { lo: 0, hi: 127 };
    return {
      lo: Math.max(instRange.lo, prange.lo),
      hi: Math.min(instRange.hi, instRange.hi),
    };
  }
  const samples = shdr[genval(sfg.sampleID)] || null;
  if (!samples) {
    debugger;
  }
  const envelope = envAmplitue(
    adsrParams.map((p) => genval(p)),
    genval(sfg.sustainVolEnv),
    48000
  );
  const egSustain = (960 - genval(sfg.sustainVolEnv)) / 960;
  // db to val ((-200.0 / 960) * Math.log((i * i) / (127 * 127))) / Math.log(10);

  const modEnv = adsrModParams.map((p) => genval(p));
  const velRange = getSFRange(sfg.velRange);
  const keyRange = getSFRange(sfg.keyRange);
  const loopKey =
    genval(sfg.overridingRootKey) > 0
      ? genval(sfg.overridingRootKey)
      : samples.originalPitch;

  const pitchInput =
    100 * (loopKey + genval(sfg.coarseTune) + genval(sfg.fineTune));
  const sampRatio = samples.sampleRate / 48000;
  return {
    velRange,
    keyRange,
    envelope,
    sample: samples,
    pitchAdjust: (outputKey: number) => {
      return sampRatio * Math.pow(2, (pitchInput - outputKey * 100) / 1200);
    },
    gain: (
      noteVelocity: number,
      midi_chan_vol: number,
      master_cc_vol: number
    ) => {
      const initialAttentuation = genval(sfg.initialAttenuation);
      const centiDB =
        initialAttentuation +
        LUT.velCB[master_cc_vol] +
        LUT.velCB[midi_chan_vol] +
        LUT.velCB[noteVelocity];
      return LUT.cent2amp[~~centiDB];
    },
    pan: genval(sfg.pan),
  };
}
