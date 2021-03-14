import * as sfTypes from './sf.types';
import { reader, Reader } from './reader';
import { LUT } from './LUT';
import { envAmplitue } from './envAmplitue';
import { SFGenerator } from './generator';
import { presetZone } from './PresetZone';

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

const pheaders: sfTypes.Phdr[] = [],
  pbag: sfTypes.Pbag[] = [],
  pgen: sfTypes.SFGen[] = [],
  pmod: sfTypes.Mod[] = [],
  inst: sfTypes.InstrHeader[] = [],
  igen: sfTypes.SFGen[] = [],
  imod: sfTypes.Mod[] = [],
  ibag: sfTypes.IBag[] = [],
  shdr: sfTypes.Shdr[] = [];

export function readPdta(
  r: Reader
): {
  pheaders: sfTypes.Phdr[];
  iheaders: sfTypes.InstrHeader[];
  shdr: sfTypes.Shdr[];
} {
  //const sections: Map<string, any> = new Map<string, any>();
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
          const pg = new SFGenerator(r.get16(), r.get16());

          if (pbag[pbagId + 1] && i >= pbag[pbagId + 1].pgen_id) {
            pbagId++;
          }
          pbag[pbagId].pgens[pg.operator] = pg;
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
          inst.push({
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
            igens: [],
          });
          if (inst[instId + 1] && i >= inst[instId + 1].iBagIndex) instId++;
          inst[instId].ibags.push(ibag[ibag.length - 1]);
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
  return { pheaders, iheaders: inst, shdr };
}

export function parsePDTA(r: Reader) {
  const { pheaders, iheaders, shdr } = readPdta(r);

  const presets: sfTypes.Preset[][] = [];

  for (const header of pheaders) {
    const preset: sfTypes.Preset = {
      ...header,
      defaultBag: null,
      zones: [],
    };

    for (const _pbag of header.pbags) {
      if (!_pbag.pgens) continue;
      if (!_pbag.pgens[instrumentGenerator]) {
        preset.defaultBag = _pbag.pgens;
        continue;
      }

      const ihead = iheaders[_pbag.pgens[instrumentGenerator].u16];
      let defaultInst;
      for (const _ibag of ihead.ibags) {
        if (!_ibag.igens[sampleId_gen]) {
          defaultInst = _ibag;
          continue;
        }

        preset.zones.push(
          presetZone(
            _ibag.igens,
            _pbag.pgens,

            preset.defaultBag,
            defaultInst,
            shdr
          )
        );
        if (_ibag.igens[sfTypes.sf_gen_id.overridingRootKey]) {
          break;
          //last one of the instr
        }
      }
    }
    presets[header.bankId] = presets[header.bankId] || [];
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
