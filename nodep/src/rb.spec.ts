import { expect } from 'chai';
import { RingBuffer } from './rb';
const malloc = () => 0;

describe('ringbufff', () => {
  it('circular and buffering', () => {
    const rb = new RingBuffer(malloc);
    expect(rb.blockLength).eq(128);
    expect(rb.sr).eq(48000);
    expect(rb.writeptr(0.03)).eq(rb.sr * 0.03 * 8);
    expect(rb.writeptr(0.03)).eq(rb.sr * 0.03 * 8);
  });
});
describe('write ptr generator', () => {
  it('returns a series of write ptrs', () => {
    const rb = new RingBuffer(malloc);
    const it = rb.writeIterator(0.0, 0.005);
    expect(it.next().value).to.eq(0);
    expect(it.next().value).to.eq(rb.blockLength * 8);
    expect(it.next().value).to.eq(null);
  });
});

describe('with start delay', () => {
  it('set stat at mid sample', () => {
    const rb = new RingBuffer(malloc, { sr: 2000, blockLength: 20 });
    expect(rb.secondsPerFrame).to.eq(0.01);
    const it = rb.writeIterator(0.008, 1);
    expect(it.next().value).to.eq(16 * 8);
    expect(rb.writeptr(0.111)).to.eq(222 * 8);
    expect(rb.writeptr(0.2111)).to.eq(338 * 8);
  });
});
