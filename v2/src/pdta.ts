import {
  Phdr,
  Pbag,
  Generator,
  Mod,
  InstrHeader,
  IBag,
  Shdr,
  Preset,
  adsrParams,
  generatorNames,
  generators,
  Zone,
} from "./sf.types";
import { Reader } from "./reader";
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
const adsrDefaults = [-12000, -12000, 1000, -12000];
export function parsePDTA(r: Reader): Preset[][] {
  //const sections: Map<string, any> = new Map<string, any>();
  let n = 0;
  const pheaders: Phdr[] = [],
    pbag: Pbag[] = [],
    pgen: Generator[] = [],
    pmod: Mod[] = [],
    inst: InstrHeader[] = [],
    igen: Generator[] = [],
    imod: Mod[] = [],
    ibag: IBag[] = [],
    shdr: Shdr[] = [];

  do {
    const sectionName = r.read32String();
    const sectionSize = r.get32();
    switch (sectionName) {
      case "phdr":
        for (let i = 0; i < sectionSize; i += phdrLength) {
          nextPhdr(r, pheaders);
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
  for (let i = 0; i < pheaders.length; i++) {
    const header = pheaders[i];
    presets[header.bankId] = presets[header.bankId] || {};
    const nextPresetBagIndex = i < pheaders.length - 1 ? pheaders[i + 1].pbagIndex : pbag.length - 1;
    let preset: Preset = {
      ...header,
      zones: [],
    };
    for (let pbagIndex = header.pbagIndex; pbagIndex < nextPresetBagIndex; pbagIndex++) {
      const _pbag = pbag[pbagIndex];
      let pgenMap: Generator[] = [];
      const pgenEnd = pbagIndex < pbag.length - 1 ? pbag[pbagIndex + 1].pgen_id : pgen[pgen.length - 1];
      for (let pgenIndex = _pbag.pgen_id; pgenIndex < pgenEnd; pgenIndex++) {
        const _pgen = pgen[pgenIndex];
        pgenMap[_pgen.operator] = _pgen;
      }
      const pbagZone = makeZone(pgenMap, shdr);
      if (pbagZone.sample) preset.zones.push(pbagZone);

      if (pgenMap[instrumentGenerator]) {
        const instId = pgenMap[instrumentGenerator]!.amount;
        const instHeader = inst[instId];
        const nextIbagIndex = inst.length - 1 ? inst[instId + 1].iBagIndex : ibag.length - 1;

        for (let _ibagIndex = instHeader.iBagIndex; _ibagIndex < nextIbagIndex; _ibagIndex++) {
          const _ibag = ibag[_ibagIndex];
          const lastIgenIndex = _ibagIndex < ibag.length - 1 ? ibag[_ibagIndex + 1].igen_id : igen.length - 1;
          const igenMap: Generator[] = [];

          for (let igenIndex = _ibag.igen_id; igenIndex < lastIgenIndex; igenIndex++) {
            const _igen = igen[igenIndex];
            igenMap[_igen.operator] = _igen;
          }
          const izone = makeZone(igenMap, shdr, pbagZone);
          preset.zones.push(izone);
        }
      }
    }
    presets[header.bankId][header.presetId] = preset;
  }
  return presets;
}
function makeZone(pgenMap: Generator[], shdr: Shdr[], baseZone?: Zone): Zone {
  return {
    velRange: pgenMap[velRangeGeneratorId]?.range ||
      baseZone?.velRange || {
        lo: 0,
        hi: 127,
      },
    keyRange: pgenMap[keyRangeGeneratorId]?.range ||
      baseZone?.keyRange || {
        lo: 0,
        hi: 127,
      },
    adsr: adsrParams.map(
      (param, idx) => pgenMap[param]?.amount || baseZone?.generators[param]?.amount || adsrDefaults[idx]
    ),
    parent: baseZone,
    sample: shdr[pgenMap[sampleId_gen]?.amount] || null,
    generators: pgenMap,
    get attributes() {
      return parseAttributes(pgenMap, baseZone?.attributes);
    },
  };
}

function parseAttributes(pgenMap: Generator[], baseValues): {} {
  return pgenMap.reduce((gmap, g) => {
    if (!g) return gmap;
    switch (g.operator) {
      case generators.initialFilterFc:
      case generators.initialAttenuation:
      case generators.initialFilterQ:
        gmap[generatorNames[g.operator]] = g.signed;
        break;
      case generators.velRange:
      case generators.keyRange:
        gmap[generatorNames[g.operator]] = g.range;
        break;
      case generators.startAddrsOffset:
      case generators.endAddrsOffset:
      case generators.startAddrsOffset:
      case generators.endloopAddrsOffset:
      case generators.fineTune:
        gmap[generatorNames[g.operator]] ||= 0;
        gmap[generatorNames[g.operator]] += g.signed;
        break;
      case generators.startAddrsCoarseOffset:
      case generators.endAddrsCoarseOffset:
      case generators.coarseTune:
        gmap[generatorNames[g.operator]] ||= 0;
        gmap[generatorNames[g.operator]] += g.signed << 15;
        break;
      default:
        gmap[generatorNames[g.operator]] = g.signed;
        break;
    }
    return gmap;
  }, baseValues || {});
}

function nextPhdr(r: Reader, pheaders: Phdr[]) {
  const phdrItem = {
    name: r.readNString(20),
    presetId: r.get16(),
    bankId: r.get16(),
    pbagIndex: r.get16(),
    misc: [r.get32(), r.get32(), r.get32()],
  };
  pheaders.push(phdrItem);
}
function nextShdr(r: Reader, shdr: Shdr[]) {
  const name = r.readNString(20);
  const [start, end, startLoop, endLoop, sampleRate, originalPitch, pitchCorrection, sampleLink, sampleType] = [
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
