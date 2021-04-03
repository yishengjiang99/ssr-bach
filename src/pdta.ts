import { SFGenerator } from './generator';
import { SFZone } from './Zone';
import { IBag, InstrHeader, Mod, Pbag, Phdr, Shdr } from './pdta.types';

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
  ibagSets: Set<number>[] = [];

  static fromUrl: (url: string) => Promise<PDTA>;
  constructor(r: any) {
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
              ibagSet: new Set<number>(),
              _defaultBag: -1,
              get defaultBag() {
                return this._defaultBag > 0
                  ? this._defaultBag
                  : this.pbags.length > 0
                  ? this.pbags[0]
                  : null;
              },
              set defaultBag(value) {
                this._defaultBag = value;
              },
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
          this.pbag.push({ pgen_id: -1, pmod_id: 0, pzone: new SFZone() });
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
            this.pbag[pbagId].pzone.applyGenVal(pg, pgenId);
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
  getIbagZone(ibagId) {
    return this.ibag[ibagId].izone;
  }
  getInstBags(instId) {
    return this.iheaders[instId].ibags.map((ibgId) => this.ibag[ibgId]);
  }
  getPbags(phdrIdx) {
    return this.phdr[phdrIdx].pbags.map((pbagId) => this.pbag[pbagId]);
  }
  getProgram(presetId, bankId) {
    return this.phdr.filter(
      (pd) => pd.bankId == bankId && pd.presetId == presetId
    )[0];
  }
  /**
   * any preceived verbosity in the following lines of code
   * was done to ensure correctness
   */
  findPreset(pid, bank_id = 0, key = -1, vel = -1): SFZone[] {
    const { phdr, igen, ibag, iheaders, pbag, pgen, shdr } = this;
    function keyVelInRange(zone, key, vel): boolean {
      return (
        (key < 0 || (zone.keyRange.lo <= key && zone.keyRange.hi >= key)) &&
        (vel < 0 || (zone.velRange.lo <= vel && zone.velRange.hi >= vel))
      );
    }
    let phIdx;
    for (phIdx = 0; phIdx < phdr.length; phIdx++) {
      if (phdr[phIdx].bankId == bank_id && phdr[phIdx].presetId == pid) break;
    }
    if (!phdr[phIdx]) return [];

    const phead = phdr[phIdx];
    const defaultPbag = pbag[phdr[phIdx].defaultBag].pzone;
    const filteredPbags = this.getPbags(phIdx).filter((pbag) =>
      keyVelInRange(pbag.pzone, key, vel)
    );
    const insts = Array.from(new Set(phead.insts).values());
    let zs = [];
    for (const instId of insts) {
      const instDefault = this.getIbagZone(iheaders[instId].defaultIbag);
      const filteredIbags = this.getInstBags(instId).filter(
        (ibg) => keyVelInRange(ibg.izone, key, vel) && ibg.izone.sampleID > -1
      );
      for (const ibg of filteredIbags) {
        for (const pbg of filteredPbags) {
          if (pbg.pzone.instrumentID != instId) continue;
          const output = new SFZone();
          for (let i = 0; i < 60; i++) {
            if (ibg.izone.generators[i]) {
              output.setVal(ibg.izone.generators[i]);
            } else if (instDefault && instDefault.generators[i]) {
              output.setVal(instDefault.generators[i]);
            }
            if (pbg.pzone.generators[i]) {
              output.increOrSet(pbg.pzone.generators[i]);
            } else if (defaultPbag && defaultPbag.generators[i]) {
              output.increOrSet(defaultPbag.generators[i]);
            }
          }
          output.sample = shdr[ibg.izone.sampleID];
          zs.push(output);
        }
      }
    }
    return zs;
  }
}
