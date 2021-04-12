/* eslint-disable @typescript-eslint/no-explicit-any */
import { SFZone, Shdr, SFGenerator } from './Zone';
import { IBag, InstrHeader, Mod, Pbag, Phdr } from './pdta.types';

type findPresetFnType = (
  pid: number,
  bank_id?: number,
  key?: number,
  vel?: number
) => {
  zones: SFZone[][];
};

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

  static fromUrl: (url: string) => Promise<PDTA>;
  findPreset: findPresetFnType = (
    pid: number,
    bank_id = 0,
    key = -1,
    vel = -1
  ) => {
    const [phdr, pbag, shdr] = [this.phdr, this.pbag, this.shdr];
    let phd,
      i = 0;
    for (i = 0; i < phdr.length - 1; i++) {
      if (phdr[i].presetId != pid || phdr[i].bankId != bank_id) {
        continue;
      }
      phd = phdr[i];
      break;
    }
    if (!phd) return [];
    const presetDefault = pbag[phd.pbagIndex];
    const pbagEnd = phdr[i + 1].pbagIndex;
    const zones = pbag
      .slice(phd.pbagIndex, pbagEnd)
      .filter(
        (pbg) =>
          pbg.pzone.instrumentID >= 0 && keyVelInRange(pbg.pzone, key, vel)
      )
      .map((pbg) => {
        const { defaultBg, izones } = this.findInstrument(
          pbg.pzone.instrumentID,
          key,
          vel
        );
        return izones.map((iz) =>
          makeRuntime(
            iz,
            defaultBg,
            pbg,
            presetDefault.pzone,
            shdr[iz.sampleID]
          )
        );
      });
    return {
      presetDefault,
      zones,
    };
  };

  findInstrument: (
    instId: number,
    key: number,
    vel: number
  ) => {
    inst: InstrHeader;
    defaultBg: SFZone;
    izones: SFZone[];
  } = (instId: any, key = -1, vel = -1) => {
    const [ibag, iheaders] = [this.ibag, this.iheaders];

    const ihead = iheaders[instId];
    return {
      inst: ihead,
      defaultBg: ibag[ihead.iBagIndex].izone,
      izones: ibag
        .slice(ihead.iBagIndex, iheaders[instId + 1].iBagIndex)
        .filter((ibg) => keyVelInRange(ibg.izone, key, vel))
        .filter(
          (ibg) => ibg.izone.sampleID > -1 && this.shdr[ibg.izone.sampleID]
        )
        .map((ibg) => ibg.izone),
    };
  };

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
              insts: [],
              _defaultBag: -1,
              get defaultBag() {
                return this._defaultBag > -1 ? this._defaultBag : this.pbags[0];
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
              pzone: new SFZone({ pbagId: i }),
            });
          }

          break;
        case 'pgen': {
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
              this.addPbagToPreset(pbagId, phdrId);
              pbagId++;
            }
          }
          break;
        }
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
        case 'ibag': {
          let ibginst = 0;
          for (let i = 0; i < sectionSize; i += pbagLength) {
            if (
              this.iheaders[ibginst + 1] &&
              i >= this.iheaders[ibginst + 1].iBagIndex
            )
              ibginst++;
            this.ibag.push({
              igen_id: r.get16(),
              imod_id: r.get16(),
              izone: new SFZone({ ibagId: i }),
            });
            this.psh(ibginst, i, pbagLength);
          }
          //.push({ igen_id: -1, imod_id: 0, izone: new SFZone() });

          this.ibag.push({ igen_id: -1, imod_id: 0, izone: new SFZone() });

          break;
        }
        case 'igen':
          {
            let ibagId = 0;
            for (let igenId = 0; igenId < sectionSize / igenLength; igenId++) {
              const opid = r.get8() | (r.get8() << 8);
              if (opid == -1) break;
              const v = r.getS16();
              const gen = new SFGenerator(opid, v);
              this.igen.push(gen);
              if (gen.operator === 60) break;
              this.ibag[ibagId].izone.applyGenVal(gen);

              if (igenId >= this.ibag[ibagId + 1].igen_id - 1) {
                ibagId++;
              }
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
  }
  private addPbagToPreset(pbagId: number, phdrId: number) {
    if (this.pbag[pbagId].pzone.instrumentID == -1) {
      if (this.phdr[phdrId].defaultBag == -1)
        this.phdr[phdrId].defaultBag = pbagId;
    } else {
      this.phdr[phdrId]!.pbags.push(pbagId);
      this.phdr[phdrId]!.insts.push(this.pbag[pbagId].pzone.instrumentID);
    }
  }

  private psh(ibginst: number, i: number, pbagLength: number) {
    this.iheaders[ibginst].ibags &&
      this.iheaders[ibginst].ibags!.push(i / pbagLength);
  }

  getIbagZone(ibagId: number) {
    return this.ibag[ibagId] && this.ibag[ibagId].izone;
  }

  /**
   * any preceived verbosity in the following lines of code
   * was done to ensure correctness
   */
}
function makeRuntime(
  izone: SFZone,
  instDefault: SFZone,
  pbg: Pbag,
  defaultPbag: SFZone,
  shr: Shdr
): SFZone {
  const output = new SFZone();
  // output.mergeWith(instDefault);
  // output.mergeWith(izone);
  // for(const gen of pbg.pzone.generators){
  //   output.applyGenVal
  // }
  for (let i = 0; i < 60; i++) {
    if (izone.generators[i]) {
      output.setVal(izone.generators[i]);
    } else if (instDefault && instDefault.generators[i]) {
      output.setVal(instDefault.generators[i]);
    }
    if (pbg.pzone.generators[i]) {
      output.increOrSet(pbg.pzone.generators[i]);
    } else if (defaultPbag && defaultPbag.generators[i]) {
      output.increOrSet(defaultPbag.generators[i]);
    }
  }
  output.applyGenVals();
  output.sample = shr;
  //delete output.generators;
  return output;
}
function keyVelInRange(zone: SFZone, key: number, vel: number): boolean {
  return (
    (key < 0 || (zone.keyRange.lo <= key && zone.keyRange.hi >= key)) &&
    (vel < 0 || (zone.velRange.lo <= vel && zone.velRange.hi >= vel))
  );
}