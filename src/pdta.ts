import * as sfTypes from './sf.types';
import { Reader } from './reader';
import { SFGenerator } from './generator';
import { SFZone } from './Zone';
export type Phdr = {
  name: string;
  presetId: number;
  bankId: number;
  pbagIndex: number;
  pbags?: number[]; // & not *
};
export type SFGen = SFGenerator;
export type Pbag = {
  pgen_id: number;
  pmod_id: number;
  pzone: SFZone;
};
export type IBag = {
  igen_id: number;
  imod_id: number;
  izone: SFZone;
};
export type Mod = {
  src: number;
  dest: number;
  amt: number;
  amtSrc: number;
  transpose: number;
};
export type InstrHeader = { name: string; iBagIndex: number; ibags?: number[] };
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
const pgenLength = 4,
  igenLength = 4;
const pmodLength = 10;
const instLength = 22;

export class PDTA {
  phdr: Phdr[] = [];
  pbag: Pbag[] = [];
  pgen: SFGen[] = [];
  pmod: Mod[] = [];
  iheaders: InstrHeader[] = [];
  igen: SFGen[] = [];
  imod: Mod[] = [];
  ibag: IBag[] = [];
  shdr: Shdr[] = [];
  igen_sets: any[];
  constructor(r: Reader) {
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
            };
            this.phdr.push(phdrItem);
          }
          break;
        case 'pbag':
          for (let i = 0; i < sectionSize; i += pbagLength) {
            this.pbag.push({
              pgen_id: r.get16(),
              pmod_id: r.get16(),
              pzone: new SFZone(),
            });
          }
          break;
        case 'pgen':
          for (
            let pgenId = 0, pbagId = 0;
            pgenId < sectionSize / pgenLength;
            pgenId++
          ) {
            const opid = r.get8();
            r.get8();
            const v = r.getS16();
            const pg = new SFGenerator(opid, v);
            this.pgen.push(pg);
            if (
              this.pbag[pbagId + 1] &&
              pgenId >= this.pbag[pbagId + 1].pgen_id
            ) {
              pbagId++;
            }
            this.pbag[pbagId].pzone.applyGenVal(pg);
          }
          break;
        case 'pmod':
          for (let i = 0; i < sectionSize; i += pmodLength) {
            this.pmod.push({
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
            this.iheaders.push({
              name: r.readNString(20),
              iBagIndex: r.get16(),
            });
          }
          break;
        case 'ibag':
          for (let i = 0; i < sectionSize; i += pbagLength) {
            this.ibag.push({
              igen_id: r.get16(),
              imod_id: r.get16(),
              izone: new SFZone(),
            });
          }
          break;
        case 'igen':
          let ibagId = 0;
          let lastIgenId = this.ibag[ibagId + 1].igen_id - 1;
          for (let i = 0; i < sectionSize; i += igenLength) {
            const opid = r.get8();
            r.get8();
            const amt = r.getS16();
            const gen = new SFGenerator(opid, amt);
            const igenId = this.igen.length; //, r.get16());
            this.igen.push(gen);
            if (
              ibagId < this.ibag.length - 1 &&
              igenId >= this.ibag[ibagId + 1].igen_id - 1
            ) {
              ibagId++;
            }

            this.ibag[ibagId].izone.applyGenVal(gen);
          }
          break;
        case 'imod':
          for (let i = 0; i < sectionSize; i += imodLength) {
            this.imod.push({
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
            this.shdr.push({
              name: r.readNString(20),
              start: r.get32(),
              end: r.get32(),
              startLoop: r.get32(),
              endLoop: r.get32(),
              sampleRate: r.get32(),
              originalPitch: r.get8(),
              pitchCorrection: r.get8(),
              sampleLink: r.get16(),
              sampleType: r.get16(),
            });
          }
          break;
        default:
          break;
      }
    } while (n++ <= 9);
  }
  /**
   * any preceived verbosity in the following lines of code
   * was done to ensure correctness
   */
  findPreset(pid, bank_id = 0, key = -1, vel = -1): SFZone[] {
    const presets: SFZone[] = [];
    const visited = new Set();
    const { phdr, igen, ibag, iheaders, pbag, pgen, shdr } = this;
    for (let i = 0; i < this.phdr.length - 1; i++) {
      if (phdr[i].presetId != pid || phdr[i].bankId != bank_id) continue;
      let predefault: SFZone;
      for (let j = phdr[i].pbagIndex; j < phdr[i + 1].pbagIndex; j++) {
        let pcpy = new SFZone();
        if (predefault)
          predefault.generators.forEach((g) => {
            pcpy.applyGenVal(g);
          });
        const pzone = pbag[j].pzone;
        if (pzone.instrumentID == -1) {
          if (!predefault) {
            predefault = pzone;
          }
          continue;
        }
        pzone.generators.forEach((g) => pcpy.applyGenVal(g));

        const keyOutofRange = pcpy.keyRange.hi < key || pcpy.keyRange.lo > key;
        if (key > -1 && keyOutofRange) continue;
        if (vel > -1 && (pcpy.velRange.hi < vel || pcpy.velRange.lo > vel))
          continue;

        const instrument = iheaders[pcpy.instrumentID];
        if (!instrument) continue;

        let instDefault;
        const lastIbag =
          pcpy.instrumentID < iheaders.length - 1
            ? iheaders[pcpy.instrumentID + 1].iBagIndex - 1
            : ibag.length - 1;
        for (let j = instrument.iBagIndex; j <= lastIbag; j++) {
          const izone = this.ibag[j].izone;
          const izoneCopy = new SFZone();
          if (instDefault)
            instDefault.generators.forEach((g) => izoneCopy.applyGenVal(g));

          if (izone.sampleID == -1) {
            if (!instDefault) {
              instDefault = izone;
            }
            continue;
          } else {
            izone.generators.forEach((g) => izoneCopy.applyGenVal(g));
          }
          if (shdr[izone.sampleID] == null) continue;
          pcpy.generators.forEach((g) => {
            g.operator !== sampleId_gen && izoneCopy.applyGenVal(g);
          });
          if (key > -1 && (izone.keyRange.hi < key || izone.keyRange.lo > key))
            continue;
          if (vel > -1 && (izone.velRange.hi < vel || izone.velRange.lo > vel))
            continue;
          izoneCopy.sample = shdr[izone.sampleID];
          presets.push(izoneCopy);
        }
      }
    }

    return presets;
  }
}
