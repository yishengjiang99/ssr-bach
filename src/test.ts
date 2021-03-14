import { SF2File } from './sffile';

const {
  sections: {
    pdta: { pheaders },
  },
} = new SF2File('sm.sf2');
console.log(pheaders[0].pbags[0].pgens);
