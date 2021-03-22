import { SF2File } from './sffile';
import { ffp } from './sinks';
const t1 = () => {
  const instrument = (process.argv[2] && parseInt(process.argv[2])) || 0;
  const [bankId, presetId] = [instrument & 0x80, instrument & 0x7f];
  const sf = new SF2File(process.argv[2] || 'file.sf2');

  const voice = sf.rend_ctx.keyOn({
    presetId: 0,
    bankId: 0,
    vel: 100,
    key: 60,
  });
  console.log(voice);
};
const t2 = () => {
  const ctx = new SF2File('file.sf2').rend_ctx;
  ctx.keyOn(44, 45, 0);
  let n = 48000 * 2;
  console.log(ctx.voices);
  const writeff = ffp();
  while (n > 0) {
    writeff.write(ctx.render(1024));
    n -= 1024;
  }
};
t2();
