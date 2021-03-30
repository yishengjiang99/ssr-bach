import test from 'ava';
import { cspawn } from './cspawn';
import { Runtime } from './Runtime';
import { LFO } from './LFO';
import { cent2hz } from './runtime.types';
import { SF2File } from './sffile';
import { ffp } from './sinks';
import { loop, pt } from './Utils';
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
  const rt = new Runtime(
    zone,
    { velocity: 33, key: 50, channel: 0 },
    sffile.rend_ctx
  );
  t.truthy(rt.staticLevels.pitch);
});

test('some real values', async (t) => {
  const ff = new SF2File('file.sf2');
  const ffplay = ffp();
  const odf = cspawn('od -f');
  ff.rend_ctx.output = pt((data: Buffer) => {
    loop(data.byteLength / 4, (n) => {
      t.assert(data.readFloatLE(n * 4) < 1.0);
    });
  }, odf.stdin);
  ff.play('piano', 55, 55);
  loop(55, () => ff.rend_ctx.render(128));
});
