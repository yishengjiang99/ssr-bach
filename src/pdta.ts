import * as sfTypes from './sf.types';
import { reader, Reader } from './reader';
import { LUT } from './LUT';
import { envAmplitue } from './envAmplitue';
import { SFGenerator } from './generator';

const sampleId_gen = 53;

const velRangeGeneratorId = 44;
const keyRangeGeneratorId = 43;
const instrumentGenerator = 41;
const ShdrLength = 46;
const ibagLength = 4;
const imodLength = 10;
const phdrLength = 38;
const pbagLength = 4;
const pgenLength = 4;
const pmodLength = 10;
const instLength = 22;

const pheaders: sfTypes.Phdr[] = [],
  pbag: sfTypes.Pbag[] = [],
  pgen: sfTypes.SFGen[] = [],
  pmod: sfTypes.Mod[] = [],
  inst: sfTypes.InstrHeader[] = [],
  igen: sfTypes.SFGen[] = [],
  imod: sfTypes.Mod[] = [],
  ibag: sfTypes.IBag[] = [],
  shdr: sfTypes.Shdr[] = [];

export function readPdta(
  r: Reader
): {
  pheaders: sfTypes.Phdr[];
  iheaders: sfTypes.InstrHeader[];
  shdr: sfTypes.Shdr[];
} {
  //const sections: Map<string, any> = new Map<string, any>();
  let n = 0;
  do {
    const sectionName = r.read32String();
    const sectionSize = r.get32();
    switch (sectionName) {
      case 'phdr':
        for (let i = 0; i < sectionSize; i += phdrLength) {
          const phdrItem = {
            name: r.readNString(20),
            presetId: r.get16(),
            bankId: r.get16(),
            pbagIndex: r.get16(),
            misc: [r.get32(), r.get32(), r.get32()],
            pbags: [],
          };
          pheaders.push(phdrItem);
        }
        break;
      case 'pbag':
        for (let i = 0, pheaderId = 0; i < sectionSize; i += pbagLength) {
          pbag.push({
            pgen_id: r.get16(),
            pmod_id: r.get16(),
            pgens: [],
          });
          if (i >= pheaders[pheaderId + 1].pbagIndex) pheaderId++;
          pheaders[pheaderId].pbags.push(pbag[i]);
        }
        break;
      case 'pgen':
        for (let i = 0, pbagId = 0; i < sectionSize; i += pgenLength) {
          pgen.push(new SFGenerator(r.get16(), r.get16()));
          if (i >= pbag[pbagId + 1].pgen_id) {
            pbagId++;
          }
          pbag[pbagId].pgens[pgen[i].operator] = pgen[i];
        }
        break;
      case 'pmod':
        for (let i = 0; i < sectionSize; i += pmodLength) {
          pmod.push({
            src: r.get16(),
            dest: r.get16(),
            amt: r.get16(),
            amtSrc: r.get16(),
            transpose: r.get16(),
          });
        }
        break;
      case 'inst':
        for (let i = 0; i < sectionSize; i += instLength) {
          inst.push({
            name: r.readNString(20),
            iBagIndex: r.get16(),
            ibags: [],
          });
        }
        break;
      case 'ibag':
        for (let i = 0, instId = 0; i < sectionSize; i += ibagLength) {
          if (i > inst[instId].iBagIndex) instId++;
          ibag.push({
            igen_id: r.get16(),
            imod_id: r.get16(),
            igens: [],
          });
          inst[instId].ibags.push(ibag[i]);
        }
        break;
      case 'igen':
        for (let i = 0, ibagId = 0; i < sectionSize; i += 4) {
          igen.push(new SFGenerator(r.get16(), r.get16()));
          if (i >= ibag[ibagId + 1].igen_id) ibagId++;
          ibag[ibagId].igens[igen[i].operator] = igen[i];
        }
        break;
      case 'imod':
        for (let i = 0; i < sectionSize; i += imodLength) {
          imod.push({
            src: r.get16(),
            dest: r.get16(),
            amt: r.get16(),
            amtSrc: r.get16(),
            transpose: r.get16(),
          });
        }
        break;
      case 'shdr':
        for (
          let i = 0;
          i < sectionSize;
          i += ShdrLength ///20 + 4 * 5 + 1 + 1 + 4)
        ) {
          nextShdr(r, shdr);
        }
        break;
      default:
        break; // `seciont name [${sectionName}]`;
    }
  } while (n++ < 8);
  return { pheaders, iheaders: inst, shdr };
}

export function parsePDTA(r: Reader) {
  const { pheaders, iheaders, shdr } = readPdta(r);
  const presets: sfTypes.Preset[][] = [];
  for (const header of pheaders) {
    presets[header.bankId] = presets[header.bankId] || [];

    // }s
  }
  return { presets, shdr, pheaders, inst };
}

function nextShdr(r: Reader, shdr: sfTypes.Shdr[]) {
  const name = r.readNString(20);
  const [
    start,
    end,
    startLoop,
    endLoop,
    sampleRate,
    originalPitch,
    pitchCorrection,
    sampleLink,
    sampleType,
  ] = [
    r.get32(),
    r.get32(),
    r.get32(),
    r.get32(),
    r.get32(),
    r.get8(),
    r.get8(),
    r.get16(),
    r.get16(),
  ];

  shdr.push({
    name,
    start,
    end,
    startLoop,
    endLoop,
    sampleRate,
    originalPitch,
    pitchCorrection,
    sampleLink,
    sampleType,
  });
}

function makeZone(
  pgenMap: sfTypes.SFGen[],
  shdr: sfTypes.Shdr[],
  baseZone?: sfTypes.Zone
): sfTypes.Zone {
  function getPgenVal(genId, type = 'signed', defaultValue = 0) {
    return (
      (pgenMap[genId] && pgenMap[genId][type]) ||
      (baseZone &&
        baseZone.generators[genId] &&
        baseZone.generators[genId][type]) ||
      defaultValue
    );
  }
  const samples = shdr[pgenMap[sampleId_gen]?.amount] || null;
  adjustSmpls(samples, getPgenVal);
  const envelopPhases = [
    getPgenVal(sfTypes.generators.delayVolEnv, 'signed', -12000),
    getPgenVal(sfTypes.generators.attackVolEnv, 'signed', -11000),
    getPgenVal(sfTypes.generators.holdVolEnv, 'signed', -12000),
    getPgenVal(sfTypes.generators.decayVolEnv, 'signed', -11000),
    getPgenVal(sfTypes.generators.releaseVolEnv, 'signed', 4000),
  ];
  const sustain = getPgenVal(sfTypes.generators.sustainVolEnv, 'amounts', 1000);
  const tuning =
    (samples && {
      root: getPgenVal(sfTypes.generators.overridingRootKey, 'signed'),
      originalPitch: samples.originalPitch,
      coarseTune: getPgenVal(sfTypes.generators.coarseTune, 'amount', 0),
      fineTune: getPgenVal(sfTypes.generators.fineTune, 'amount', 0),
    }) ||
    null;
  return {
    velRange: pgenMap[velRangeGeneratorId]?.range ||
      baseZone?.velRange || { lo: 0, hi: 127 },
    keyRange: pgenMap[keyRangeGeneratorId]?.range ||
      baseZone?.keyRange || { lo: 0, hi: 127 },
    envAmplitue: (sr) => envAmplitue(envelopPhases, sustain, sr),
    sample: samples,
    get generators() {
      return pgenMap;
    },
    pitchAjust: (outputKey: number, sampleRate: number) => {
      const { root, originalPitch, fineTune, coarseTune } = tuning;
      const inputKey = root > 0 ? root : originalPitch;
      return (
        (Math.pow(
          2,
          ((outputKey - inputKey + coarseTune) * 100 - fineTune) / 1200
        ) *
          samples.sampleRate) /
        sampleRate
      );
    },
    attenuation: getPgenVal(sfTypes.generators.initialAttenuation),
    gain: (
      noteVelocity: number,
      midi_chan_vol: number,
      master_cc_vol: number
    ) => {
      const initialAttentuation = getPgenVal(
        sfTypes.generators.initialAttenuation,
        'signed'
      );
      const centiDB =
        initialAttentuation +
        LUT.velCB[master_cc_vol] +
        LUT.velCB[midi_chan_vol] +
        LUT.velCB[noteVelocity];

      return LUT.cent2amp[centiDB];
    },
    pan: getPgenVal(sfTypes.generators.pan),
    misc: {
      envelopPhases,
      sustain,
      tuning,
    },
  };
}
function adjustSmpls(
  samples: sfTypes.Shdr,
  getPgenVal: (genId: any, type?: string, defaultValue?: number) => any
) {
  if (samples != null) {
    const shoff = sfTypes.attributeGenerators.sampleOffsets.map((oper) =>
      getPgenVal(oper, 'amount', 0)
    );
    samples.start += shoff[0];
    samples.end += shoff[1];
    samples.startLoop += shoff[2];
    samples.endLoop += shoff[3];
  }
}
