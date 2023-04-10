import { RenderCtx } from './render-ctx';
import { SF2File } from './sffile';

function test(str, fn) {
  console.log(str);
  //fn();
}

test('renderctx', (t) => {
  const ctx = new RenderCtx(new SF2File('file.sf2'));
  ctx.keyOn(55, 13, 0);
  console.assert(ctx.voices[0].mods.ampVol.done == false);
  console.assert(ctx.voices[0].iterator >= 0);
  console.assert(ctx.voices[0].staticLevels.pitch != 0);
  console.assert(ctx.voices[0].iterator == ctx.voices[0].smpl.start);
  const b = ctx.render(5);

  console.assert(
    ctx.voices[0].iterator >
      Math.floor(ctx.voices[0].smpl.start + ctx.voices[0].run(5).pitch * 4)
  );
});
test('mixing', (t) => {
  const rff = new SF2File('file.sf2');
  const ctx = rff.rend_ctx;
  ctx.keyOn(55, 77, 0);
  ctx.keyOn(67, 44, 1);
  const b = ctx.render(466);
  console.assert(b.byteLength == 466 * 8);
  const fl = new Float32Array(b.buffer);
  for (let i = 0; i < fl.length; i++) {
    console.assert(fl[i] <= 1.0);
  }
});
test('sf runtime', (t) => {
  const sff = new SF2File('file.sf2');
  const rctx = sff.rend_ctx;
  const v = rctx.keyOn(35, 45, 0);
  console.assert(v.staticLevels.pitch != 0, 'static levefl pitch isnt zero');
});
const rff = new SF2File('file.sf2');
const ctx = rff.rend_ctx;
const b = ctx.render(313);
ctx.keyOn(55, 77, 0);
ctx.keyOn(67, 44, 1);
const fl = new Float32Array(b);
