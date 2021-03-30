import * as sfTypes from './sf.types';
import { Reader } from './reader';
import { SFGenerator } from './generator';
import { SFZone } from './Zone';
import { IBag, InstrHeader, Mod, Pbag, Phdr, Shdr } from './pdta.types';
import { match } from 'node:assert';

export class PDTA {
  phdr: Phdr[] = [];
  pbag: Pbag[] = [];
  pgen: SFGenerator[] = [];
  pmod: Mod[] = [];
  iheaders: InstrHeader[] = [];
  igen: SFGenerator[] = [];
  imod: Mod[] = [];
  ibag: IBag[] = [];
  shdr: Shdr[] = [];
  igen_sets: any[];
  constructor(r: Reader) {
    let n = 0;
    do {
      const ShdrLength = 46;
      const imodLength = 10;
      const phdrLength = 38;
      const pbagLength = 4;
      const pgenLength = 4,
        igenLength = 4;
      const pmodLength = 10;
      const instLength = 22;
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
              insts: [],
              defaultBag: -1,
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
          let pgenId = 0,
            pbagId = 0,
            phdrId = 0;
          for (; pgenId < sectionSize / pgenLength; pgenId++) {
            const opid = r.get8();
            r.get8();
            const v = r.getS16();
            const pg = new SFGenerator(opid, v);
            this.pgen.push(pg);
            if (pg.operator == 60) break;
            this.pbag[pbagId].pzone.applyGenVal(pg);
            if (
              this.pbag[pbagId + 1] &&
              pgenId >= this.pbag[pbagId + 1].pgen_id - 1
            ) {
              if (pbagId >= this.phdr[phdrId + 1].pbagIndex) {
                phdrId++;
              }
              if (this.pbag[pbagId].pzone.instrumentID == -1) {
                if (this.phdr[phdrId].defaultBag == -1)
                  this.phdr[phdrId].defaultBag = pbagId;
              } else {
                this.phdr[phdrId].pbags.push(pbagId);
                this.phdr[phdrId].insts.push(
                  this.pbag[pbagId].pzone.instrumentID
                );
              }
              pbagId++;
            }
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
              defaultIbag: -1,
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
          let instId = 0;
          for (let igenId = 0; igenId < sectionSize / igenLength; igenId++) {
            const opid = r.get8() | (r.get8() << 8);
            const v = r.getS16();
            const gen = new SFGenerator(opid, v);
            this.igen.push(gen);
            if (gen.operator === 60) break;
            this.ibag[ibagId].izone.applyGenVal(gen);
            if (igenId >= this.ibag[ibagId + 1]?.igen_id - 1) {
              if (ibagId >= this.iheaders[instId + 1]?.iBagIndex) {
                instId++;
              }
              this.iheaders[instId].ibags.push(ibagId);
              this.ibag[ibagId].izone.instrumentID = instId;
              if (this.ibag[ibagId].izone.sampleID == -1) {
                if (this.iheaders[instId].defaultIbag == -1)
                  this.iheaders[instId].defaultIbag = ibagId;
              } else {
                this.iheaders[instId].ibags.push(ibagId);
              }
              ibagId++;
            }
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
    this.phdr.forEach((phead) => {
      phead.ibagSet = new Set();
      phead.insts.forEach((instId) => {
        this.iheaders[instId].ibags.forEach((ibagId) =>
          phead.ibagSet.add(ibagId)
        );
      });
    });
  }
  /**
   * any preceived verbosity in the following lines of code
   * was done to ensure correctness
   */
  findPreset(pid, bank_id = 0, key = -1, vel = -1): SFZone[] {
    const { phdr, igen, ibag, iheaders, pbag, pgen, shdr } = this;
    const phead = phdr.filter(
      (p) => p.bankId == bank_id && p.presetId == pid
    )[0];
    if (!phead) {
      return [];
    }

    const defaultPbag = phead?.defaultBag
      ? pbag[phead?.defaultBag]?.pzone
      : null;
    const instMap = {};
    Array.from(phead.ibagSet.values())
      .map((ibagId) => ibag[ibagId])
      .filter((ibag) => this.keyVelInRange(ibag.izone, key, vel))
      .forEach((ibg) => {
        if (!ibg.izone.sampleID || !shdr[ibg.izone.sampleID]) return;
        const instId = ibg.izone.instrumentID;
        instMap[instId] = instMap[instId] || [];
        const output = new SFZone();
        const defaultIbag = iheaders[ibg.izone.instrumentID].defaultIbag;
        if (defaultIbag && ibag[defaultIbag]?.izone) {
          output.mergeWith(ibag[defaultIbag].izone);
        }
        output.mergeWith(ibg.izone);
        instMap[instId].push(output);
      });

    const matchedPbags = phead.pbags
      .map((pbagId) => pbag[pbagId])
      .filter((pbag) => this.keyVelInRange(pbag.pzone, key, vel))
      .filter(
        (pbg) => pbg.pzone.instrumentID > -1 && instMap[pbg.pzone.instrumentID]
      );

    const zones = [];
    for (const pbag of matchedPbags) {
      for (const output of instMap[pbag.pzone.instrumentID]) {
        if (defaultPbag) output.mergeWith(defaultPbag);
        output.mergeWith(pbag.pzone);
        output.sample = shdr[output.sampleID];
        zones.push(output);
      }
    }
    return zones;
  }
  keyVelInRange(zone, key, vel): boolean {
    return (
      (key < 0 || (zone.keyRange.lo <= key && zone.keyRange.hi >= key)) &&
      (vel < 0 || (zone.velRange.lo <= vel && zone.velRange.hi >= vel))
    );
  }
  getZone(pid, bank_id = 0): SFZone[] {
    return this.findPreset(pid, bank_id);
  }
}
