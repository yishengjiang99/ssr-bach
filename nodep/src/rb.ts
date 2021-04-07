const bytesPerSample = 8; //nchan*nbytes

export class RingBuffer {
  sr = 41000;
  blockLength: number;
  blocks: number;
  blockSize: number;
  secondsPerFrame: number;
  stateBuffer: Uint32Array;
  data: Float32Array;
  constructor(
    u8a: Uint8Array,
    opts?: { blockLength?: number; blocks?: number; sr?: number }
  ) {
    opts = opts || {};
    this.blockLength = opts.blockLength || 128;
    this.blocks = opts.blocks || 20;
    this.sr = opts.sr || 48000;
    this.stateBuffer = new Uint32Array(u8a, 0, 2);
    this.data = new Float32Array(u8a, 8, this.blockLength * this.blocks);
    this.secondsPerFrame = this.blockLength / this.sr;
  }
  get readOffset(): number {
    const blocks = Atomics.load(this.stateBuffer, 0);
    return (blocks % (this.blocks - 1)) * this.blockLength;
  }
  get perfTime(): number {
    return Atomics.load(this.stateBuffer, 0) * this.secondsPerFrame;
  }

  increment(): void {
    Atomics.add(this.stateBuffer, 0, 1);
  }
  shift(): Float32Array {
    const start = (this.readOffset % (this.blocks - 1)) * this.blockSize;
    return this.data.slice(start, start + this.blockSize);
  }

  writeptr(start: number): number {
    let delay = start - this.perfTime;
    if (delay > this.perfTime + this.secondsPerFrame * (this.blocks - 1)) {
      return -1;
    }
    if (delay >= this.blockLength * (this.blocks - 1)) {
      delay -= this.blockLength * (this.blocks - 1);
    }
    return Math.ceil(this.readOffset + bytesPerSample * delay);
  }
  *writeIterator(
    _start: number,
    _duration: number
  ): Generator<number, null, null> {
    while (_duration > 0) {
      const pt = this.writeptr(_start);
      if (pt !== -1) {
        _duration -= this.secondsPerFrame;
        _start += this.secondsPerFrame;
      }
      yield pt;
    }
    return null;
  }
}
