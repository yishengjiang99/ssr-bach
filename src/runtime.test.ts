import test from 'ava';
import { cspawn } from './cspawn';
import { Runtime } from './Runtime';
import { LFO } from './LFO';
import { cent2hz } from './runtime.types';
import { SF2File } from './sffile';
import { ffp } from './sinks';
import { loop, pt, range } from './Utils';
import { SFZone } from './Zone';

test('LFO Instantiates and has expected parameters', (t) => {
  const lfo = new LFO(-1200, 1, { volume: 11 });
  t.truthy(lfo);
  t.truthy(lfo.delay);
  t.truthy(lfo.delta);
  t.truthy(lfo.effects.volume);
  t.falsy(lfo.effects.pitch);
});
test('LFO delay', (t) => {
  const lfo = new LFO(-12000, 1, { volume: 11 }, 100);
  // lfo.sampleRate = 100;

  t.assert(lfo.delay < 3);
  lfo.shift(3);
  t.assert(lfo.amount > 0);
  lfo.shift(3);
  t.assert(lfo.amount > 0);
});
test('LFO shifts linearly (in db)', (t) => {
  const lfo = new LFO(-12111, 1200, { volume: 11 });
  // lfo.sampleRate = 100;
  t.is(lfo.delta, (4 * cent2hz(1200)) / lfo.sampleRate);
  t.is(lfo.shift(1), lfo.delta);
  t.is(lfo.shift(3), 4 * lfo.delta);
});
test('LFO will shift signs un delta upon reaching 1/2', (t) => {
  const lfo = new LFO(-12111, 1200, { volume: 37 });
  lfo.shift(Math.floor(1 / lfo.delta) + 1);
  t.assert(lfo.delta < 0);
  lfo.shift(480000);
  t.assert(lfo.cycles > 2);
});

test('runtime function', (t) => {
  const sffile = new SF2File('file.sf2');
  const zone: SFZone = sffile.findPreset({
    bankId: 0,
    presetId: 56,
    vel: 100,
    key: 50,
  })[0];
  t.truthy(zone);
  sffile.rend_ctx.sampleRate = zone.sample.sampleRate;
  const rt = new Runtime(zone, { velocity: 33, key: 50 });
  t.truthy(rt.staticLevels.pitch);
});
const ff = new SF2File('file.sf2');

test.only('some real values', async (t) => {
  for (let i = 0; i < 128; i++) {
    ff.rend_ctx.programs[0] = { presetId: i, bankId: 0 };
    range(55).map((m) => {
      const z = ff.rend_ctx.keyOn(m + 30, m + 34);
      if (!z) {
        //console.log(i, m);
        return;
      }

      loop(1555, (it) => {
        const st = z && z.run(12);
        t.assert(st.volume < 1.1);
      });
    });
    break;
  }
  t.pass();
});
test.only('strings trem', (t) => {
  const zs = ff.pdta.findPreset(44, 0, 40, 45);
  //console.log(zs);
  ff.rend_ctx.programs[0] = { presetId: 44, bankId: 0 };
  const rt = ff.rend_ctx.keyOn(40, 45);
  //console.log(Object.values(rt.mods).map((m) => m.effects));
  t.assert(rt != null);
  const o = ffp();
  loop(550, (n) => {
    o.write(ff.rend_ctx.render(128));
    t.assert(true);
    if (n == 0) {
      o.end();
      t.pass();
    }
  });
});
