import * as sfTypes from './sf.types';
import { Reader } from './reader';
import { SFGenerator } from './generator';
import { SF2File } from './sffile';
import { presetZone } from './PresetZone';
import { assert } from 'console';
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

const instrumentGenerator = 41;
const ShdrLength = 46;
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
    //console.log(sectionName, sectionSize);
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
          if (pheaders[pheaderId + 1] && i >= pheaders[pheaderId + 1].pbagIndex)
            pheaderId++;
          pheaders[pheaderId].pbags.push(pbag[pbag.length - 1]);
        }
        break;
      case 'pgen':
        for (let i = 0, pbagId = 0; i < sectionSize; i += pgenLength) {
          const opid = r.get8();
          r.get8();
          const lo = r.get8(),
            hi = r.get8();
          const amt = lo | (hi << 8);

          const pg = new SFGenerator(opid, amt); //, r.get16());
          if (pbag[pbagId + 1] && i >= pbag[pbagId + 1].pgen_id) {
            pbagId++;
          }
          pgen.push(pg);
          pbag[pbagId].pgens[pg.operator] = pg; //(pg);
        }
        //console.log(nt, nit);
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
        for (let i = 0; i < sectionSize; i += pbagLength) {
          ibag.push({
            igen_id: r.get16(),
            imod_id: r.get16(),
            igens: {},
          });
        }
        break;
      case 'igen':
        for (let i = 0, ibagId = 0; i < sectionSize; i += 4) {
          const opid = r.get8();
          r.get8();
          const amt = (r.get8() << 8) | r.get8();

          const gen = new SFGenerator(opid, amt); //, r.get16());
          if (ibag[ibagId + 1] && i >= ibag[ibagId + 1].igen_id) {
            ibagId++;
          }
          igen.push(gen);
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
const { instrument, sampleID } = sfTypes.sf_gen_id;
export function parsePDTA(r: Reader) {
  readPdta(r);
  const presets = [];
  console.log(process.hrtime());
  for (let i = 0; i < pheaders.length - 1; i++) {
    const { pbagIndex, bankId, presetId } = pheaders[i];
    presets[bankId] = presets[bankId] || [];
    presets[bankId][presetId] = {
      ...pheaders[i],
      zones: [],
    };

    const npbagId = pheaders[i + 1].pbagIndex;
    let defaultPbag = null;
    for (let j = pbagIndex; j < npbagId && j < pbag.length - 1; j++) {
      const { pgen_id } = pbag[j];
      const n_pgen_id = pbag[j + 1].pgen_id;
      const pbag_gen_set = new Map<number, SFGenerator>();
      for (let k = n_pgen_id - 1; k >= pgen_id; k--) {
        const { operator } = pgen[k];
        pbag_gen_set.set(operator, pgen[k]);
      }
      if (!pbag_gen_set.has(instrument)) {
        if (defaultPbag === null) defaultPbag = pbag_gen_set;
      } else {
        const instId = pbag_gen_set.get(instrument).u16;
        if (!iheaders[instId]) {
          console.log('no ', instId, 'in instid');
          continue;
        }
        const { iBagIndex }: InstrHeader = iheaders[instId];
        const nextIBagIndex = iheaders[instId + 1].iBagIndex;
        let defaultIbag = null;
        for (let ij = iBagIndex; ij < nextIBagIndex && ij < ibag.length; ij++) {
          const { igen_id } = ibag[ij];
          const n_igen_id = ibag[ij + 1].igen_id;
          const ibag_gen_set = new Map<number, SFGenerator>();
          for (let ik = n_igen_id - 1; ik >= igen_id; ik--) {
            const { operator } = igen[ik];
            ibag_gen_set.set(operator, igen[ik]);
          }
          if (!ibag_gen_set.has(sampleID)) {
            if (defaultIbag === null) defaultIbag = ibag_gen_set;
          } else {
            continue;
          }
          for (let gi = 0; gi < 60; gi++) {
            if (defaultPbag && defaultPbag.has(gi) && !pbag_gen_set.has(gi))
              pbag_gen_set.set(gi, defaultPbag.get(gi));
            if (defaultIbag && defaultIbag.has(gi) && !ibag_gen_set.has(gi)) {
              ibag_gen_set.set(gi, defaultIbag.get(gi));
            }
          }
          presets[bankId][presetId].zones.push(
            presetZone(ibag_gen_set, pbag_gen_set, shdr)
          );
        }
      }
    }
  }
  console.log(process.hrtime());
  return { presets: presets, shdr, pheaders, inst: iheaders };
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
  assert(start / 2 < r.fstat().size);

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
export function test() {
  const {
    sections: {
      pdta: { pheaders, presets },
    },
  } = new SF2File('./file.sf2');
  pheaders[0].pbags.map((b) => {
    console.log(b);
  });
  presets[0][0].zones.map((z) => {
    console.log(z.velRange, z.keyRange, z.sample.name);
  });
}
