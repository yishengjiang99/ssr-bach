import test from 'ava';
import { assert } from 'node:console';
import { cent2hz } from './Zone';
import { LFO } from './LFO';
import { RenderCtx } from './render-ctx';
import { Runtime } from './runtime';
import { SF2File } from './sffile';
import { loop } from './Utils';
import { std_drums, std_inst_names } from './utilv1';
import { SFZone } from './Zone';
const sff = new SF2File('file.sf2');
const ctx = new RenderCtx(sff);
test('lfo', (t) => {
  const lf = new LFO(-12000, 1200, { pitch: 3 }, 4000);
  const zone = new SFZone();
  zone.modLFO = lf;
  const rt = new Runtime(zone, { key: 45, velocity: 127, channel: 0 }, ctx);
  t.assert(lf.effects.pitch == 3);
  lf.shift(4001);
  console.log(lf, cent2hz(1200));
  t.assert(lf.cycles == Math.floor(cent2hz(1200)) * 2);
  loop(4000, () => t.assert(lf.shift() < 1.1));
});
test('tuba', (t) => {
  const tubaz = sff.pdta.findPreset(58, 0, 55, 33)[0];
  t.truthy(tubaz);
  const rt = new Runtime(tubaz, { key: 55, velocity: 33, channel: 1 }, ctx);
  loop(50, () => {
    console.log(rt.run(1).pitch);

    t.assert(
      Math.abs(
        (rt.run(128).pitch - rt.staticLevels.pitch) / rt.staticLevels.pitch
      ) < 2
    );
  });

  console.log(rt.run(128).pitch, rt.mods.vibrLFO);
});
