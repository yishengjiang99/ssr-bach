import * as sfTypes from "./sf.types";
import { reader, Reader } from "./reader";
import { LUT } from "./LUT";
import { envAmplitue } from "./envAmplitue";
import { Envelope } from "ssr-cxt";

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
export function parsePDTA(
  r: Reader
): {
  presets: sfTypes.Preset[][];
  shdr: sfTypes.Shdr[];
  pheaders: sfTypes.Phdr[];
  inst: sfTypes.InstrHeader[];
} {
  //const sections: Map<string, any> = new Map<string, any>();
  let n = 0;
  const pheaders: sfTypes.Phdr[] = [],
    pbag: sfTypes.Pbag[] = [],
    pgen: sfTypes.SFGen[] = [],
    pmod: sfTypes.Mod[] = [],
    inst: sfTypes.InstrHeader[] = [],
    igen: sfTypes.SFGen[] = [],
    imod: sfTypes.Mod[] = [],
    ibag: sfTypes.IBag[] = [],
    shdr: sfTypes.Shdr[] = [];

  do {
    const sectionName = r.read32String();
    const sectionSize = r.get32();
    switch (sectionName) {
      case "phdr":
        for (let i = 0; i < sectionSize; i += phdrLength) {
          const phdrItem = {
            name: r.readNString(20),
            presetId: r.get16(),
            bankId: r.get16(),
            pbagIndex: r.get16(),
            misc: [r.get32(), r.get32(), r.get32()],
          };
          pheaders.push(phdrItem);
        }
        break;
      case "pbag":
        for (let i = 0; i < sectionSize; i += pbagLength) {
          const bag = {
            pgen_id: r.get16(),
            pmod_id: r.get16(),
          };
          pbag.push(bag);
        }
        break;
      case "pgen":
        for (let i = 0; i < sectionSize; i += pgenLength) {
          const [operator, lo, hi] = [r.get16(), r.get8(), r.get8()];
          pgen.push({
            operator,
            range: { lo, hi },
            amount: lo | (hi << 8),
            signed: hi & 0x80 ? -0x10000 + (lo | (hi << 8)) : lo | (hi << 8),
          });
        }
        break;
      case "pmod":
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
      case "inst":
        for (let i = 0; i < sectionSize; i += instLength) {
          inst.push({
            name: r.readNString(20),
            iBagIndex: r.get16(),
          });
        }
        break;
      case "igen":
        for (let i = 0; i < sectionSize; i += 4) {
          const [operator, lo, hi] = [r.get16(), r.get8(), r.get8()];

          igen.push({
            operator,
            range: { lo, hi },
            amount: lo | (hi << 8),
            signed: hi & 0x80 ? -0x10000 + (lo | (hi << 8)) : lo | (hi << 8),
          });
        }
        break;
      case "imod":
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
      case "ibag":
        for (let i = 0; i < sectionSize; i += ibagLength) {
          ibag.push({
            igen_id: r.get16(),
            imod_id: r.get16(),
          });
        }
        break;
      case "shdr":
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

  const presets: any = {};
  for (let i = 0; i < pheaders.length - 1; i++) {
    const header = pheaders[i];
    presets[header.bankId] = presets[header.bankId] || {};
    let preset: sfTypes.Preset = {
      ...header,
      defaultBag: null,
      zones: [],
    };
    for (
      let pbagIndex = header.pbagIndex;
      pbagIndex < pheaders[i + 1].pbagIndex;
      pbagIndex++
    ) {
      const _pbag = pbag[pbagIndex];
      let pgenMap: sfTypes.SFGen[] = [];
      const pgenEnd =
        pbagIndex < pbag.length - 1 ? pbag[pbagIndex + 1].pgen_id : pgen[pgen.length - 1];
      for (let pgenIndex = _pbag.pgen_id; pgenIndex < pgenEnd; pgenIndex++) {
        const _pgen = pgen[pgenIndex];
        pgenMap[_pgen.operator] = _pgen;
      }
      if (pgenMap[sfTypes.generators.instrument] == null) {
        if (preset.defaultBag == null) preset.defaultBag = makeZone(pgenMap, shdr, null);
      } else {
        const pbagZone = makeZone(pgenMap, shdr, preset.defaultBag);
        if (pbagZone.sample) preset.zones.push(pbagZone);
        const instId = pgenMap[instrumentGenerator]!.amount;
        const instHeader = inst[instId];
        const nextIbagIndex =
          inst.length - 1 ? inst[instId + 1].iBagIndex : ibag.length - 1;
        for (
          let _ibagIndex = instHeader.iBagIndex;
          _ibagIndex < nextIbagIndex;
          _ibagIndex++
        ) {
          const _ibag = ibag[_ibagIndex];
          const lastIgenIndex =
            _ibagIndex < ibag.length - 1 ? ibag[_ibagIndex + 1].igen_id : igen.length - 1;
          const igenMap: sfTypes.SFGen[] = [];

          for (let igenIndex = _ibag.igen_id; igenIndex < lastIgenIndex; igenIndex++) {
            const _igen = igen[igenIndex];
            igenMap[_igen.operator] = _igen;
          }
          if (
            igenMap[sfTypes.generators.sampleID] &&
            shdr[igenMap[sfTypes.generators.sampleID].amount]
          ) {
            const izone = makeZone(igenMap, shdr, preset.defaultBag);
            izone.misc.instrument = instHeader.name;
            if (izone.sample) preset.zones.push(izone);
          }
        }
      }
    }
    presets[header.bankId][header.presetId] = preset;
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
  function getPgenVal(genId, type = "signed", defaultValue = 0) {
    return (
      (pgenMap[genId] && pgenMap[genId][type]) ||
      (baseZone && baseZone.generators[genId] && baseZone.generators[genId][type]) ||
      defaultValue
    );
  }
  const samples = shdr[pgenMap[sampleId_gen]?.amount] || null;
  adjustSmpls(samples, getPgenVal);
  const envelopPhases = [
    getPgenVal(sfTypes.generators.delayVolEnv, "signed", -12000),
    getPgenVal(sfTypes.generators.attackVolEnv, "signed", -12000),
    getPgenVal(sfTypes.generators.holdVolEnv, "signed", -12000),
    getPgenVal(sfTypes.generators.decayVolEnv, "signed", -12000),
    getPgenVal(sfTypes.generators.releaseVolEnv, "signed", -12000),
  ];
  const sustain = Math.pow(
    10,
    (-0.05 / 10) * getPgenVal(sfTypes.generators.sustainVolEnv, "signed", 1000)
  );
  const [_d, a, _h, d, r] = envelopPhases.map((n) =>
    n < -12000 ? 0 : Math.pow(2, n / 12000)
  );
  return {
    velRange: pgenMap[velRangeGeneratorId]?.range ||
      baseZone?.velRange || { lo: 0, hi: 127 },
    keyRange: pgenMap[keyRangeGeneratorId]?.range ||
      baseZone?.keyRange || { lo: 0, hi: 127 },
    envAmplitue: function* (sr: number): Generator<number, number, Error> {
      const env = new Envelope(sr, [a, d, sustain, r]);

      while (true) {
        const next = env.shift();
        if (next < -0.1) return 0;
        else yield next;
      }
    },
    sample: samples,
    get generators() {
      return pgenMap;
    },
    pitchAjust: (outputKey: number, sampleRate: number) => {
      let root = getPgenVal(sfTypes.generators.overridingRootKey, "signed");
      if (!root || root == -1) root = samples.originalPitch;
      const coarseTune = getPgenVal(sfTypes.generators.coarseTune, "amount", 0);
      const fineTune = getPgenVal(sfTypes.generators.fineTune, "amount", 0);

      return (
        (Math.pow(2, (outputKey + coarseTune - fineTune * 100) / 1200) *
          samples.sampleRate) /
        sampleRate
      );
    },
    attenuation: getPgenVal(sfTypes.generators.initialAttenuation),
    gain: (noteVelocity: number, midi_chan_vol: number, master_cc_vol: number) => {
      const initialAttentuation = getPgenVal(
        sfTypes.generators.initialAttenuation,
        "signed"
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
      envelopPhases: [
        a,
        d,
        getPgenVal(sfTypes.generators.sustainVolEnv, "signed", 1000),
        r,
      ],
    },
  };
}
function adjustSmpls(
  samples: sfTypes.Shdr,
  getPgenVal: (genId: any, type?: string, defaultValue?: number) => any
) {
  if (samples != null) {
    const shoff = sfTypes.attributeGenerators.sampleOffsets.map((oper) =>
      getPgenVal(oper, "amount", 0)
    );
    samples.start += shoff[0];
    samples.end += shoff[1];
    samples.startLoop += shoff[2];
    samples.endLoop += shoff[3];
  }
}
