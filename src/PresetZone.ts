import { envAmplitue } from './envAmplitue';
import { SFGenerator, GenRange } from './generator';
import { LUT } from './LUT';
import { Shdr } from './pdta';
import { sf_gen_id as sfg, adsrParams, adsrModParams } from './sf.types';

export type Zone = {
  velRange: GenRange;
  keyRange: GenRange;
  envelope: (
    sr: number,
    noteVelocity: number
  ) => Generator<number, number, Error>;
  misc?: any;
  sample: Shdr;
  pan?: number;
  attenuation?: number;
  pitchAdjust: (key: number) => number;
  gain: (noteVelocity: number, channelVol: number, masterVol: number) => number;
};
export function presetZone(
  igenSet: Map<number, SFGenerator>,
  pgenSet: Map<number, SFGenerator>,
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
    const instRange = igenSet.has(genId)
      ? igenSet.get(genId).range
      : { lo: 0, hi: 127 };
    const prange = pgenSet.has(genId)
      ? pgenSet.get(genId).range
      : { lo: 0, hi: 127 };
    return {
      lo: Math.max(instRange.lo, prange.lo),
      hi: Math.min(instRange.hi, prange.hi),
    };
  }
  const samples = shdr[genval(sfg.sampleID)] || null;
  if (!samples) {
    debugger;
  }

  const modEnv = adsrModParams.map((p) => genval(p));
  const velRange = getSFRange(sfg.velRange);
  const keyRange = getSFRange(sfg.keyRange);
  const loopKey =
    genval(sfg.overridingRootKey) > 0
      ? genval(sfg.overridingRootKey)
      : samples.originalPitch;

  const pitchInput =
    100 * (loopKey + genval(sfg.coarseTune)) + genval(sfg.fineTune);
  const sampRatio = samples.sampleRate / 48000;
  return {
    velRange,
    keyRange,
    sample: samples,
    envelope: (sr, vel) =>
      envAmplitue(
        adsrParams.map((p) => genval(p)),
        genval(sfg.sustainVolEnv),
        sr,
        vel
      ),
    pitchAdjust: (outputKey: number) => {
      console.log(
        sampRatio * Math.pow(2, (outputKey * 100 - pitchInput) / 1200)
      );
      return sampRatio * Math.pow(2, (outputKey * 100 - pitchInput) / 1200);
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
    misc: {
      igenSet,
      pgenSet,
      adsr: adsrParams.map((p) => genval(p)),
      genval,
    },
  };
}
