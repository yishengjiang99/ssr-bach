import test from 'ava';
import { RingBuffer } from './sdta';

test('ringbuffer', (t) => {
  const malloc = () => 0;
  const rb = new RingBuffer(malloc);
  t.is(rb.writeptr(0.3), rb.sr * 0.3);
});
