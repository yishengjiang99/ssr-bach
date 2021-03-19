import { readFileSync, writeFileSync } from 'fs';
import { deserialize, serialize } from 'v8';
import { SF2File } from './sffile';
function serializePresets(file) {
  const {
    sections: {
      pdta: { pheaders, inst, presets, shdr },
    },
  } = new SF2File(file);
  console.log(presets);
  const b = serialize(presets[0][0].zones[0]);
  writeFileSync('./serialied_presets_00.dat', b);
}
function fromSerialization(srDatFile: string) {
  const val = deserialize(readFileSync(srDatFile));
  console.log(val);
}
serializePresets('./sm.sf2');
fromSerialization('./serialied_presets_00.dat');
