import { centibel } from './centTone';
import { envAmplitue } from './envAmplitue';
import { LUT } from './LUT';
import { SFZone } from './Zone';

type RunTimeParams = {
  noteVelocity: number;
  noteEnd?: number;
  sampleRate: number;
  chanVol: number;
  masterVol: number;
  key: number;
};

export function runtime(
  zone: SFZone,
  { noteVelocity, key, noteEnd, sampleRate, chanVol, masterVol }: RunTimeParams
) {
  const {
    phases: { delay, attack, hold, decay, release },
    sustain,
  } = zone.volEnv;
  const ampEnv = envAmplitue(
    [delay, (attack * (144 - noteVelocity)) / 127, hold, decay, release],
    sustain,
    sampleRate,
    noteEnd
  ); //.genDBVals();
  const pitchRatio =
    (Math.pow(2, (zone.pitch - key) / 1200) * zone.shdr.sampleRate) /
    this.sampleRate;
  const attentuation: centibel =
    zone.attenuate +
    LUT.midiCB[chanVol] +
    LUT.velCB[noteVelocity] +
    LUT.midiCB[masterVol];
  const overallGain = LUT.cent2amp[attentuation];
  return {
    envelope: ampEnv.genDBVals(),
    pitchRatio: pitchRatio,
    gain: overallGain,
  };
}
