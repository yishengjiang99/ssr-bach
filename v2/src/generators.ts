import * as sfTypes from "./sf.types";
import { velRangeGeneratorId, keyRangeGeneratorId } from "./pdta";

export class LUT {
  static midiCB: number[] = [];
  static frqST: number[] = [];
  static relPC: number[] = [];
  static absTC: number[] = [];
  //lets pretend we have commadore 64 and make lookup tables!!

  init() {
    LUT.midiCB[0] = -Infinity;
    LUT.absTC = [];
    LUT.relPC = [];
    LUT.frqST = [];
    for (let n = 1; n < 128; n++) {
      LUT.midiCB[n] = 200 * Math.log10((127 * 127) / (n * n));
    }
    for (let n = 0; n < 20000; n++) {
      LUT.absTC[n] = Math.pow(2, (n - 12000) / 1200);
    }
    for (let n = 0; n < 2400; n++) {
      LUT.relPC[n] = Math.pow(2.0, (n - 1200.0) / 1200.0);
    }
    for (let n = 0; n < 128; n++) {
      LUT.frqST[n] = 440 * Math.pow(2, (n - 69) / 12.0);
    }
  }
}

export function makeZone(
  pgenMap: sfTypes.Generator[],
  shdr: sfTypes.Shdr,
  baseZone?: sfTypes.Zone
): any {
  function getPgenVal(genId, type = "signed") {
    return (
      (pgenMap[genId] && pgenMap[genId][type]) ||
      (baseZone && baseZone.generators[genId] && baseZone.generators[genId][type])
    );
  }

  const { frqST, relPC } = LUT;

  return {
    velRange: pgenMap[velRangeGeneratorId]?.range || baseZone?.velRange,
    keyRange: pgenMap[keyRangeGeneratorId]?.range || baseZone?.keyRange,
    modEnvelope: function* (sampleRate) {
      let egmod = 0;
      const sustain = getPgenVal(sfTypes.generators.sustainVolEnv);
      const [delay, attack, hold, decay, release] = sfTypes.adsrParams
        .map((operator) => getPgenVal(operator))
        .map((val, index) => {
          const seconds = LUT.absTC[val],
            steps = seconds * sampleRate;
          return {
            steps: index == 5 ? 0x7fff : LUT.absTC[val],
            delta: [0, 1 / steps, 0, (1 - sustain) / steps, egmod / 10, egmod / 20][
              index
            ],
          };
        });
      const adsr = [delay, attack, hold, decay, release];
      while (true) {
        egmod += adsr[0].delta;
        adsr[0].steps--;
        if (adsr[0].steps <= 0) adsr.shift();
      }
    },
    pitchAdjust(outputKey, outputSampleRate = 48000) {
      const oscFrq =
        frqST[outputKey + pgenMap[sfTypes.generators.coarseTune]] *
        relPC[pgenMap[sfTypes.generators.coarseTune].AbsCents + 1200];
      return ((shdr.sampleRate / outputSampleRate) * oscFrq) / frqST[shdr.originalPitch];
    },
    amplitude_multiplier(midi_master_vol, midi_chan_vol, noteVelocity) {
      const initialAttentuation = getPgenVal(sfTypes.generators.initialAttenuation);
    },
  };
}
