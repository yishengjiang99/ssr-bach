import * as sfTypes from './sf.types';
import { reader, Reader } from './reader';
import { LUT } from './LUT';
import { envAmplitue } from './envAmplitue';
import { SFGenerator } from './generator';
import { presetZone } from './PresetZone';
import { writeFileSync } from 'fs';
import { SF2File } from './sffile';
import { Preset } from './sf.types';
export type Phdr = {
  name: string;
  presetId: number;
  bankId: number;
  pbagIndex: number;
  pbags?: Pbag[];
};
export type SFGen = SFGenerator;
export type Pbag = {
  pgen_id: number;
  pmod_id: number;
  pgens: Record<number, SFGenerator>;
};
export type IBag = {
  igen_id: number;
  imod_id: number;
  igens: Record<number, SFGenerator>;
};
export type Mod = {
  src: number;
  dest: number;
  amt: number;
  amtSrc: number;
  transpose: number;
};
export type InstrHeader = { name: string; iBagIndex: number; ibags?: IBag[] };
export type Shdr = {
  name: string;
  start: number;
  end: number;
  startLoop: number;
  endLoop: number;
  sampleRate: number;
  originalPitch: number;
  pitchCorrection: number;
  sampleLink: number;
  sampleType: number;
};
export type GenSet = Record<number, SFGenerator>;
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
const pheaders: Phdr[] = [],
  pbag: Pbag[] = [],
  pgen: SFGen[] = [],
  pmod: Mod[] = [],
  iheaders: InstrHeader[] = [],
  igen: SFGen[] = [],
  imod: Mod[] = [],
  ibag: IBag[] = [],
  shdr: Shdr[] = [];

export function readPdta(r: Reader) {
  //const sections: Map<string, any> = new Map<string, any>();
  let n = 0;
  do {
    const sectionName = r.read32String();
    const sectionSize = r.get32();
    console.log(sectionName, sectionSize);
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
            pgens: {},
          });
          if (pheaders[pheaderId + 1] && i >= pheaders[pheaderId + 1].pbagIndex)
            pheaderId++;
          pheaders[pheaderId].pbags.push(pbag[pbag.length - 1]);
        }
        break;
      case 'pgen':
        for (let i = 0, pbagId = 0; i < sectionSize; i += pgenLength) {
          const pg = new SFGenerator(r.get16(), r.get16());
          if (pbag[pbagId + 1] && i >= pbag[pbagId + 1].pgen_id) {
            pbagId++;
          }
          pbag[pbagId].pgens[pg.operator] = pg;
          break;
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
          iheaders.push({
            name: r.readNString(20),
            iBagIndex: r.get16(),
            ibags: [],
          });
        }
        break;
      case 'ibag':
        for (let i = 0, instId = 0; i < sectionSize; i += pbagLength) {
          ibag.push({
            igen_id: r.get16(),
            imod_id: r.get16(),
            igens: {},
          });
          if (iheaders[instId + 1] && i >= iheaders[instId + 1].iBagIndex)
            instId++;
          iheaders[instId].ibags.push(ibag[ibag.length - 1]);
        }
        break;
      case 'igen':
        for (let i = 0, ibagId = 0; i < sectionSize; i += 4) {
          const gen = new SFGenerator(r.get16(), r.get16());
          igen.push(gen);
          if (ibag[ibagId + 1] && i >= ibag[ibagId + 1].igen_id) ibagId++;
          ibag[ibagId].igens[gen.operator] = gen;
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
}

export function parsePDTA(r: Reader) {
  readPdta(r);
  const presets = [];

  mergeBagDefaults();
  for (const pheader of pheaders) {
    console.log(pheader);
    presets[pheader.bankId] = presets[pheader.bankId] || [];
    presets[pheader.bankId][pheader.presetId] = {
      ...pheader,
      zones: pheader.pbags.reduce((arr, pbagg) => {
        console.log(pbagg);
        if (!pbagg.pgens[instrumentGenerator]) {
          console.log('no inst');
          return arr;
        }
        const instt = iheaders[pbagg.pgens[instrumentGenerator].u16];
        return arr.concat(
          instt.ibags.map((ibagg) => presetZone(ibagg, pbagg, shdr))
        );
      }, []),
    };
  }
  return { presets, shdr, pheaders, inst: iheaders };
}

function mergeBagDefaults() {
  function mergeDefault(bag: GenSet, defaultBag: GenSet) {
    for (const genOp of Object.keys(defaultBag)) {
      if (!bag[genOp]) bag[genOp] = defaultBag[genOp];
      console.log('merging ', genOp, 'from defualt bagg');
    }
  }
  for (const header of iheaders) {
    let defaultibag = header.ibags.filter(
      (ipbag) => ipbag.igens[sampleId_gen] == null
    )[0];
    for (const ipbag of header.ibags) {
      mergeDefault(ipbag, defaultibag);
    }
  }
  for (const header of pheaders) {
    let defaultPbag = header.pbags.filter(
      (pbag) => pbag.pgens[instrumentGenerator] == null
    )[0];
    header.pbags.forEach((pbag) => {
      mergeDefault(pbag, defaultPbag);
    });
  }
}

function nextShdr(r: Reader, shdr: Shdr[]) {
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
