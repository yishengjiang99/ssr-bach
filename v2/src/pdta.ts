import * as sfTypes from "./sf.types";
import { reader, Reader } from "./reader";
import { Envelope } from "./envelope";
import { makeZone } from "./generators";
export const sampleId_gen = 53;

export const velRangeGeneratorId = 44;
export const keyRangeGeneratorId = 43;
const instrumentGenerator = 41;
const ShdrLength = 46;
const ibagLength = 4;
const imodLength = 10;
const phdrLength = 38;
const pbagLength = 4;
const pgenLength = 4;
const pmodLength = 10;
const instLength = 22;
let n = 0;
const pheaders: sfTypes.Phdr[] = [],
  pbag: sfTypes.Pbag[] = [],
  pgen: sfTypes.Generator[] = [],
  pmod: sfTypes.Mod[] = [],
  inst: sfTypes.InstrHeader[] = [],
  igen: sfTypes.Generator[] = [],
  imod: sfTypes.Mod[] = [],
  ibag: sfTypes.IBag[] = [],
  shdr: sfTypes.Shdr[] = [];
export const hydra = {
  pheaders,
  pbag,
  pgen,
  pmod,
  inst,
  igen,
  imod,
  ibag,
  shdr,
};
export function readPDTA(r: Reader) {
  //const sections: Map<string, any> = new Map<string, any>();

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
}
export function parsePDTA(r: Reader): sfTypes.Preset[][] {
  readPDTA(r);
  const presets: any = {};
  for (let i = 0; i < pheaders.length; i++) {
    const header = pheaders[i];
    presets[header.bankId] = presets[header.bankId] || {};
    const nextPresetBagIndex =
      i < pheaders.length - 1 ? pheaders[i + 1].pbagIndex : pbag.length - 1;
    let preset: sfTypes.Preset = {
      ...header,
      defaultBag: null,
      zones: [],
    };
    for (let pbagIndex = header.pbagIndex; pbagIndex < nextPresetBagIndex; pbagIndex++) {
      const _pbag = pbag[pbagIndex];
      let pgenMap: sfTypes.Generator[] = [];
      const pgenEnd =
        pbagIndex < pbag.length - 1 ? pbag[pbagIndex + 1].pgen_id : pgen[pgen.length - 1];
      for (let pgenIndex = _pbag.pgen_id; pgenIndex < pgenEnd; pgenIndex++) {
        const _pgen = pgen[pgenIndex];
        pgenMap[_pgen.operator] = _pgen;
      }
      const pbagZone = makeZone(pgenMap, shdr, preset.defaultBag);
      if (pgenMap[sfTypes.generators.sampleID] !== null) {
        if (pbagZone.sample) {
          preset.zones.push(pbagZone);
        } else {
          preset.defaultBag = pbagZone;
        }
      }
      if (pgenMap[instrumentGenerator]) {
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
          const igenMap: sfTypes.Generator[] = [];

          for (let igenIndex = _ibag.igen_id; igenIndex < lastIgenIndex; igenIndex++) {
            const _igen = igen[igenIndex];
            igenMap[_igen.operator] = _igen;
          }
          if (
            igenMap[sfTypes.generators.sampleID] &&
            shdr[igenMap[sfTypes.generators.sampleID].amount]
          ) {
            const izone = makeZone(igenMap, shdr, pbagZone);
            preset.zones.push(izone);
          }
        }
      }
    }
    presets[header.bankId][header.presetId] = preset;
  }
  return presets;
}
export const defaultZone: sfTypes.Zone = {
  velRange: {
    lo: 0,
    hi: 127,
  },
  keyRange: {
    lo: 0,
    hi: 127,
  },
  adsr: [0, 0, 0.69, 0],
  parent: null,
  sample: null,
  lowPassFilter: {
    centerFreq: 0.5,
    q: 0,
  },
  attenuation: 0,
  pan: -5,
  generators: [],
};
export function parseAttributes(pgenMap: sfTypes.Generator[], baseValues): {} {
  return pgenMap.reduce((gmap, g) => {
    if (!g) return gmap;
    switch (g.operator) {
      case sfTypes.generators.initialFilterFc:
      case sfTypes.generators.initialAttenuation:
      case sfTypes.generators.initialFilterQ:
        gmap[sfTypes.generatorNames[g.operator]] = g.signed;
        break;
      case sfTypes.generators.velRange:
      case sfTypes.generators.keyRange:
        gmap[sfTypes.generatorNames[g.operator]] = g.range;
        break;
      case sfTypes.generators.startAddrsOffset:
      case sfTypes.generators.endAddrsOffset:
      case sfTypes.generators.startAddrsOffset:
      case sfTypes.generators.endloopAddrsOffset:
      case sfTypes.generators.fineTune:
        gmap[sfTypes.generatorNames[g.operator]] ||= 0;
        gmap[sfTypes.generatorNames[g.operator]] += g.signed;
        break;
      case sfTypes.generators.startAddrsCoarseOffset:
      case sfTypes.generators.endAddrsCoarseOffset:
      case sfTypes.generators.coarseTune:
        gmap[sfTypes.generatorNames[g.operator]] ||= 0;
        gmap[sfTypes.generatorNames[g.operator]] += g.signed << 15;
        break;
      default:
        gmap[sfTypes.generatorNames[g.operator]] = g.signed;
        break;
    }
    return gmap;
  }, baseValues || {});
}

function nextPhdr(r: Reader, pheaders: sfTypes.Phdr[]) {
  const phdrItem = {
    name: r.readNString(20),
    presetId: r.get16(),
    bankId: r.get16(),
    pbagIndex: r.get16(),
    misc: [r.get32(), r.get32(), r.get32()],
  };
  pheaders.push(phdrItem);
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
