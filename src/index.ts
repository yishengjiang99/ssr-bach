import { centidb2gain } from './centTone';
import { Runtime } from './runtime';
import { sf_gen_id } from './sf.types';
import { SF2File } from './sffile';
import { ffp } from './sinks';
import { loop } from './Utils';
import { createWriteStream } from 'fs';
import { sleep } from './utilv1';
import { Envelope } from './envAmplitue';
import { SFZone } from './Zone';
import { SFGenerator } from './generator';
const hrdiff = (h1, h2) => h2[0] - h1[0] + (h2[1] - h1[1]) * 1e-9;

const z = new SFZone();
z.applyGenVal(new SFGenerator(8, 44));
console.log(z.generators);

const t1 = async () => {
  const instrument = (process.argv[2] && parseInt(process.argv[2])) || 0;
  const [bankId, presetId] = [instrument & 0x80, instrument & 0x7f];
  const sf = new SF2File(process.argv[2] || 'file.sf2');

  const voice = sf.rend_ctx.keyOn(66, 55, 0);
  console.log(voice.zone, voice.mods.ampVol.stages, voice.mods.ampVol.deltas);
  console.log(voice.zone, voice.mods.modVol.stages, voice.mods.modVol.deltas);
  //const ffffp = ffp();
  sf.rend_ctx.sampleRate = voice.zone.sample.sampleRate;
  voice.run(1);
  const fd = createWriteStream('file.pcm'); //openSync('file.pcm', 'w');
  loop(120, async () => {
    fd.write(sf.rend_ctx.render(128));
    await sleep(3.5);
  });
};
const t2 = () => {
  const ctx = new SF2File('file.sf2').rend_ctx;
  ctx.keyOn(44, 45, 0);
  let n = 48000 * 2;
  console.log(ctx.voices[0].mods.vibrLFO);

  while (n > 0) {
    const fl = ctx.render(1024);

    n -= 1024;
  }
};
t2();

function ffpiano() {
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
