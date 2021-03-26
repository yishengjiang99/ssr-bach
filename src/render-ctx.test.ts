import test from 'ava';
import { assert } from 'console';
import { RenderCtx } from './render-ctx';
import { SF2File } from './sffile';

test('renderctx', (t) => {
  const ctx = new RenderCtx(new SF2File('file.sf2'));
  ctx.keyOn(55, 13, 0);
  t.assert(ctx.voices[0].mods.ampVol.done == false);
  t.assert(ctx.voices[0].iterator >= 0);
  t.assert(ctx.voices[0].staticLevels.pitch != NaN);
  t.assert(ctx.voices[0].iterator == ctx.voices[0].smpl.start);
  const b = ctx.render(5);

  t.assert(
    ctx.voices[0].iterator >
      Math.floor(ctx.voices[0].smpl.start + ctx.voices[0].run(5).pitch * 4)
  );
});
test('mixing', (t) => {
  const ctx = new RenderCtx(new SF2File('sm.sf2'));
  ctx.keyOn(55, 77, 0);
  ctx.keyOn(67, 44, 1);
  const b = ctx.render(466);
  t.assert(b.byteLength == 466 * 8);
  for (let i = 0; i < b.byteLength - 4; i += 4) {
    t.assert(b.readFloatLE(i) <= 1.0);
  }
});
test('sf runtime', (t) => {
  const sff = new SF2File('file.sf2');
  const rctx = sff.rend_ctx;
  const v = rctx.keyOn({ bankId: 0, presetId: 0, key: 44, vel: 44 }, 0.5, 0);
  t.assert(v.staticLevels.pitch != NaN);
});
