import { stdout } from 'process';
import { SF2File } from './sffile';
const instrument = (process.argv[2] && parseInt(process.argv[2])) || 0;
const [bankId, presetId] = [instrument & 0x80, instrument & 0x7f];
const sf = new SF2File(process.argv[2] || 'file.sf2');

const pz = sf.findPreset({ bankId: 0, presetId: 0, key: 44, vel: 65 });

process.stdout.write(
  JSON.stringify(
    pz.map((z) => {
      const { sampleOffsets, vibrLFO, modEnv, sampleID, pitch } = z;
      return { sampleOffsets, vibrLFO, modEnv, sampleID, pitch };
    })
  )
);
