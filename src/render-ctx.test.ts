import test from 'ava';
import { assert } from 'console';
import { RenderCtx } from './render-ctx';
import { SF2File } from './sffile';

test('renderctx', (t) => {
  const ctx = new RenderCtx(new SF2File('sm.sf2'));
  ctx.keyOn({ bankId: 0, presetId: 0, key: 44, vel: 44 }, 0.5, 0);
  t.assert(ctx.voices[0].length == ctx.sampleRate / 2);
  t.assert(ctx.voices[0].envelopeIterator.next().done == false);
  t.assert(ctx.voices[0].iterator >= 0);
  const b = ctx.render(128);
  //console.log(ctx.voices[0].zone.pitchAdjust(44)); //);
  assert(Float32Array.from(b).every((f) => f <= 1.0));
});
