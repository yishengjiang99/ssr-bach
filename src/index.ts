import { SF2File } from './sffile';
const instrument = (process.argv[2] && parseInt(process.argv[2])) || 0;
const [bankId, presetId] = [instrument & 0x80, instrument & 0x7f];
const sf = new SF2File(process.argv[2] || 'file.sf2');

const pz = sf.findPreset({ bankId, presetId, key: 44, vel: 65 });
console.log(pz);
