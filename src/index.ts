import { SF2File } from './sffile';
const instrument = (process.argv[2] && parseInt(process.argv[2])) || 0;
const [bankId, presetId] = [instrument & 0x80, instrument & 0x7f];
const sffile = new SF2File(process.argv[2] || 'file.sf2');
const {
  sections: {
    pdta: { presets },
    sdta,
  },
  findPreset,
  keyOn,
} = sffile;
const l = presets[bankId][presetId];
console.log(l);
