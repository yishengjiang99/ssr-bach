import { Runtime } from './runtime';
import { SF2File } from './sffile';
import { ffp } from './sinks';
import { loop } from './Utils';
import { createWriteStream } from 'fs';
import { change_ext, sleep, std_inst_names } from './utilv1';
import { Envelope } from './envAmplitue';
import { sf_gen_id } from './sf.types';
import { SFfromUrl, uint8sf2 } from './SFBK';
import { initSDTA } from './sdta';
import { readFileSync } from 'fs';
import { cspawn } from './cspawn';
const hrdiff = (h1, h2) => h2[0] - h1[0] + (h2[1] - h1[1]) * 1e-9;
const sff = new SF2File('file.sf2');
function loadInstrument(instname) {
  sff
    .findPreset({
      bankId: 0,
      presetId: std_inst_names.indexOf(instname),
      key: -1,
      vel: -1,
    })
    .map((zone) => {
      sff.sdta.data.slice(zone.sample.start * 4, zone.sample.end);
      console.log(
        zone.sample.start * 4,
        zone.sample.end,
        zone.sample.name,
        zone.velRange,
        zone.keyRange,
        zone.instrumentID,
        zone.sample,
        zone.generators
      );
    });
}

loadInstrument('oboe');

const t1 = async () => {
  const instrument = (process.argv[2] && parseInt(process.argv[2])) || 0;
  const [bankId, presetId] = [instrument & 0x80, instrument & 0x7f];
  const sf = new SF2File(process.argv[2] || 'file.sf2');

  const voice = sf.rend_ctx.keyOn(66, 55, 0);
  //console.log(voice.zone, voice.mods.ampVol.stages, voice.mods.ampVol.deltas);
  //console.log(voice.zone, voice.mods.modVol.stages, voice.mods.modVol.deltas);
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
  ctx.render(0);
  //console.log(ctx.voices[0].mods.vibrLFO);

  while (n > 0) {
    const fl = ctx.render(1024);

    n -= 1024;
  }
};

function ffpiano() {}
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
  //console.log(vol.phases, g.stages, g.deltas, g.val, g.state);
  g.shift(1000);
  //console.log(g.val, g.state);
  g.shift(1000);
  //console.log(g.val, g.state);
  g.shift(1000);
  g.triggerRelease();
  //console.log(g.val, g.state);
  //console.log(g.val, g.state);
  g.shift(1000);
}
function testtunning() {
  const sff = new SF2File('file.sf2');
  const vol = sff.findPreset({ bankId: 0, presetId: 0, key: 33, vel: 44 });
  const r = new Runtime(vol[0], { key: 86, velocity: 44, channel: 0 }, 1);
  //console.log(vol[0], r.mods);

  //console.log(r.run(128));
  let n = 48000;
  while (n > 0) {
    //console.log(r.run(128).volume);
    // //console.log(
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

export function pitchshift() {
  const sf = new SF2File(process.argv[2] || 'file.sf2');
  sf.pdta.pgen
    .filter((g) => g.operator == sf_gen_id.vibLfoToPitch)
    .map(
      (
        g //console.log(g));
      ) =>
        //console.log(
        sf.pdta.pbag.filter((pb) => pb.pgen_id == 5377) // 5380 && pb.pgen_id > 5100)
    );
}
