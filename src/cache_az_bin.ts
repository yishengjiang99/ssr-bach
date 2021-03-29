import { SF2File } from './sffile';

import { uploadSync, wsclient } from 'grepupload';
import { std_inst_names, std_drums } from './utilv1';
const wc = wsclient(process.env.AZ_CONN_STR);
wc.createContainer('sff', {
  access: 'container',
});
export function cachesets(gmf) {
  const sf = new SF2File(gmf);
  const cl = wc.getContainerClient('sff');
  uploadSync(gmf, 'sff');

  for (let i = 0; i < 127; i++) {
    try {
      findprint([gmf, std_inst_names, i].join('-') + '.json', 0, i);
    } catch (e) {
      console.error(e);
    }
  }
  function findprint(filename, bnakID, presetId) {
    const str = JSON.stringify(sf.pdta.findPreset(presetId, bnakID));
    console.log(filename);
    cl.uploadBlockBlob(filename, Buffer.from(str), str.length);
  }
}
console.log(process.argv);

const ff = require('fs')
  .readdirSync('sf2')
  .forEach((f) => cachesets(require('path').resolve('sf2', f)));
