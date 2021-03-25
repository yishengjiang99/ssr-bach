import { centidb2gain } from './centTone';
import { Envelope, Runtime } from './runtime';
import { SF2File } from './sffile';
import { ffp } from './sinks';
import { sleep } from './utilv1';
const t1 = () => {
  const instrument = (process.argv[2] && parseInt(process.argv[2])) || 0;
  const [bankId, presetId] = [instrument & 0x80, instrument & 0x7f];
  const sf = new SF2File(process.argv[2] || 'file.sf2');

  const voice = sf.rend_ctx.keyOn(44, 44, 0);
  console.log(voice);
};
const t2 = () => {
  const ctx = new SF2File('file.sf2').rend_ctx;
  ctx.keyOn(44, 45, 0);
  let n = 48000 * 2;
  console.log(ctx.voices);

  while (n > 0) {
    const fl = ctx.render(1024);

    n -= 1024;
  }
};
function t3() {
  const { std_inst_names } = require('./utilv1');

  const sf = new SF2File('file.sf2');

  for (let i = 0; i < 127; i++) {
    findprint([0, i, std_inst_names[i]].join('-') + '.json', 0, i);
  }

  function findprint(filename, bnakID, presetId) {
    const ff = require('fs').createWriteStream(`cache/${filename}`);
    ff.write('{');
    sf.pdta.findPreset(presetId, bnakID).forEach((z, i, arr) => {
      console.log(z.sampleID);
      const copy = JSON.parse(JSON.stringify(z));
      delete copy.generators;

      ff.write(
        `"${z.velRange.lo}-${z.velRange.hi}-${z.keyRange.lo}-${
          z.keyRange.hi
        }":${JSON.stringify(copy)}${i < arr.length - 1 ? ',' : ''}`
      );
    });
    ff.end('}');
  }
}

function t45() {
  const sff = new SF2File('file.sf2');
  const ctx = sff.rend_ctx;
  ctx.programs[1] = { presetId: 0, bankId: 0 };
  const voice = ctx.keyOn(44, 88, 1);

  const proc = require('./cspawn').cspawn(
    'ffplay -i pipe:0 -ac 2 -ar 12000 -f s16le'
  );
  proc.stdin.write(
    sff.sdta.bit16s.slice(voice.smpl.start * 2, voice.smpl.end * 2)
  );
  proc.stdin.end();
}
//t3();
function t5() {
  const sff = new SF2File('file.sf2');
  const vol = sff.findPreset({ bankId: 0, presetId: 0, key: 60, vel: 70 })[0]
    .volEnv;
  const sr = 48000;
  const {
    phases: { delay, attack, hold, decay, release },
    sustain,
  } = vol;
  const g = new Envelope([delay, attack, hold, decay, release], sustain, sr);
  let i = 0;
  const hh = require('fs').createWriteStream('ss.pcm');
  const so = ffp();
  while (g.done == false) {
    const v = g.val;

    const o = Math.pow(10, v / 200) * Math.sin(((440 * 6.14) / 48000) * i);
    i++;
    const iob = Buffer.alloc(4);
    iob.writeFloatLE(o);
    so.write(iob);

    if (i == 24000) g.triggerRelease();
  }
}
async function t6() {
  const ctx = new SF2File('file.sf2').rend_ctx;

  const b = require('./cspawn').cspawn(
    'ffplay -i pipe:0 -ac 2 -ar ' + 48000 + ' -f f32le'
  ).stdin;

  let k = 33;
  setInterval(() => {
    ctx.keyOn(k, 127 - k, 0);
    k++;
    if (k > 55) k -= ~~(Math.random() * 54);
  }, 500);
  setInterval(() => {
    b.write(ctx.render(4800));
  }, 100);
}
function testEnvelopeTriggerRelease() {
  const sff = new SF2File('file.sf2');
  const vol = sff.findPreset({ bankId: 0, presetId: 0, key: 60, vel: 70 })[0]
    .volEnv;
  const sr = 48000;
  const {
    phases: { delay, attack, hold, decay, release },
    sustain,
  } = vol;
  const g = new Envelope([delay, attack, hold, decay, release], sustain, sr);
  console.log(vol.phases, g.stages, g.deltas, g.val, g.state);
  g.shift(1000);
  console.log(g.val, g.state);
  g.shift(1000);
  console.log(g.val, g.state);
  g.shift(1000);
  g.triggerRelease();
  console.log(g.val, g.state);
  console.log(g.val, g.state);
  g.shift(1000);
}
function testtunning() {
  const sff = new SF2File('file.sf2');
  const vol = sff.findPreset({ bankId: 0, presetId: 0, key: 33, vel: 44 });
  const r = new Runtime(
    vol[0],
    { key: 86, velocity: 44, channel: 0 },
    sff.rend_ctx
  );
  console.log(vol[0], r.mods);

  console.log(r.run(128));
  let n = 48000;
  while (n > 0) {
    console.log(r.run(128).volume);
    // console.log(
    //   r.mods.modLFO.cycles,
    //   r.mods.modVol.deltas,
    //   r.mods.vibrLFO.delta,
    //   r.mods.ampVol.state,
    //   r.mods.modVol.state
    // );
    n -= 128;
  }

  const g = new Envelope(
    {
      decay: 2400,
      attack: -7973,
      delay: -7973,
      release: -2786,
      hold: -7973,
    },
    1000
  );
}
t6();
