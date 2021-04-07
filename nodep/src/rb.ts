const bytesPerSample = 8; //nchan*nbytes

export class RingBuffer {
  readOffset = 0;

  sr: number = 41000;
  blockLength: number;
  blocks: number;
  obOffset: any;
  blockSize: number;
  perfTime: number = 0;
  secondsPerFrame: number;
  constructor(
    malloc: (arg0: number) => any,
    opts?: { blockLength?: number; blocks?: number; sr?: number }
  ) {
    opts = opts || {};
    this.blockLength = opts.blockLength || 128;
    this.blocks = opts.blocks || 20;
    this.sr = opts.sr || 48000;
    this.obOffset = malloc(this.blockLength * this.blocks);
    this.secondsPerFrame = this.blockLength / this.sr;
  }
  shift() {
    this.perfTime += this.secondsPerFrame;
    const ret = bytesPerSample * this.readOffset + this.obOffset;
    if (this.readOffset >= this.blockLength * (this.blocks - 1)) {
      this.readOffset = 0;
    } else {
      this.readOffset += this.blockLength;
    }
    return ret;
  }
  writeptr(start: number) {
    let delay = (start - this.perfTime) * this.sr - this.readOffset;
    if (delay > this.blockLength * (this.blocks * 2 - 2)) {
      return -1;
    }
    while (delay > this.blockLength * (this.blocks - 1)) {
      delay -= this.blockLength * (this.blocks - 1);
    }
    return Math.ceil(this.obOffset + bytesPerSample * delay);
  }
  *writeIterator(start: number, duration: number) {
    while (duration > 0) {
      const pt = this.writeptr(start);
      if (pt !== -1) {
        duration -= this.secondsPerFrame;
        start += this.secondsPerFrame;
      }
      yield pt;
    }
    return null;
  }
}
