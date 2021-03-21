import * as sfTypes from './sf.types';
import { Reader } from './reader';
import { SFGenerator } from './generator';
import { SF2File } from './sffile';
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
const { instrument, sampleID } = sfTypes.sf_gen_id;

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
            this.phdr.push(phdrItem);
          }
          break;
        case 'pbag':
          for (let i = 0, pheaderId = 0; i < sectionSize; i += pbagLength) {
            this.pbag.push({
              pgen_id: r.get16(),
              pmod_id: r.get16(),
              pzone: new SFZone(),
            });
            if (pheaderId >= this.phdr[pheaderId + 1].pbagIndex) pheaderId++;
            this.phdr[pheaderId].pbags.push(i);
          }
          break;
        case 'pgen':
          // r.setOffset(r.getOffset() + sectionSize);
          for (let i = 0, pbagId = 0; i < sectionSize; i += pgenLength) {
            const opid = r.get8();
            r.get8();
            const v = r.getS16();
            const pg = new SFGenerator(opid, v);
            this.pgen.push(pg);
            if (this.pbag[pbagId + 1] && i >= this.pbag[pbagId + 1].pgen_id) {
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
              ibags: [],
            });
          }
          break;
        case 'ibag':
          for (let i = 0, instId = 0; i < sectionSize; i += pbagLength) {
            this.ibag.push({
              igen_id: r.get16(),
              imod_id: r.get16(),
              izone: new SFZone(),
            });
            if (
              this.iheaders[instId + 1] &&
              i > this.iheaders[instId + 1].iBagIndex
            )
              instId++;
            this.iheaders[instId].ibags.push(i);
          }
          break;
        case 'igen':
          for (let i = 0, ibagId = 0; i < sectionSize; i += 4) {
            const opid = r.get8();
            r.get8();
            const amt = r.getS16();
            const gen = new SFGenerator(opid, amt); //, r.get16());
            this.igen.push(gen);
            if (this.ibag[ibagId + 1] && i >= this.ibag[ibagId + 1].igen_id)
              ibagId++;
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

            this.shdr.push({
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
          break;
        default:
          break; // `seciont name [${sectionName}]`;
      }
    } while (n++ < 9);
  }

  findPreset(pid, bank_id, key = -1, vel = -1): SFZone[] {
    let presets = [];
    const { phdr, igen, ibag, iheaders, pbag, pgen, shdr } = this;
    for (let i = 0; i < this.phdr.length - 1; i++) {
      if (phdr[i].presetId != pid || phdr[i].bankId != bank_id) continue;
      const matchingpzones = phdr[i].pbags
        .map((idx) => pbag[idx].pzone)
        .filter((pzone) => pzone.instrumentID !== -1)
        .filter((pzone) => pzone.keyRange.lo < key && pzone.keyRange.hi > key)
        .filter((pzone) => pzone.velRange.lo < vel && pzone.velRange.hi > vel);
      for (const pzone of matchingpzones) {
        const izones = iheaders[pzone.instrumentID].ibags
          .map((idx) => ibag[idx].izone)
          .filter((izone) => izone.sampleID !== -1)
          .filter((izone) => izone.keyRange.lo < key && izone.keyRange.hi > key)
          .filter((izone) => izone.velRange.lo < vel && izone.velRange.hi > vel)
          .forEach((izone) => {
            pzone.generators.forEach((g) => {
              izone.applyGenVal(g);
            });
            presets.push(izone);
          });
      }
      return presets;
    }
  }
}
