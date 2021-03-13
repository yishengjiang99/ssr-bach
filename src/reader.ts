import { openSync, readSync, Stats, statSync } from 'fs';
export type Reader = {
  getc: () => number;
  get8: () => number;
  get16: () => number;
  read32String: () => string;
  get32: () => number;
  fstat: () => Stats;
  skip: (n: number) => void;
  getOffset: () => number;
  setOffset: (n: number) => void;
  readN: (n: number) => Buffer;
  readNString: (n: number) => string;
  varLenInt: () => number;
};
export const LE = 0x00;
export const BE = 0x01;
const endmask = 0x01;
export function reader(path: string, opts: number = 0): Reader {
  let offset: number = 0;
  const le = (opts & endmask) == 0;
  const fd = openSync(path, 'r');

  const getc = function (): number {
    const buffer: Buffer = Buffer.alloc(4);
    readSync(fd, buffer, 0, 4, offset);
    offset++;
    return buffer.readUInt8();
  };
  const get8 = function (): number {
    return getc();
  };
  const get16 = function (): number {
    if (le) return get8() | (get8() << 8);
    else return (get8() << 8) | get8();
  };
  const get32 = function (): number {
    const buffer: Buffer = Buffer.alloc(16);
    readSync(fd, buffer, 0, 16, offset);
    offset += 4;
    return le ? buffer.readUInt32LE(0) : buffer.readUInt32BE(0);
  };
  const read32String = function (): string {
    return [getc(), getc(), getc(), getc()]
      .map((c) => {
        return String.fromCharCode(c);
      })
      .join('');
  };
  function fstat() {
    return statSync(path);
  }

  let skipped = [];
  function skip(n: number) {
    skipped.push(offset);
    offset += n;
  }
  function getOffset() {
    return offset;
  }
  function setOffset(n: number) {
    offset = n;
  }
  function readN(n: number) {
    const buffer: Buffer = Buffer.alloc(n);
    readSync(fd, buffer, 0, n, offset);
    offset += n;
    return buffer;
  }
  function readNString(n: number) {
    const buffer: Buffer = Buffer.alloc(n);
    readSync(fd, buffer, 0, n, offset);
    offset += n;
    return buffer.toString('ascii', 0, buffer.indexOf(0x00));
  }
  function varLenInt(): number {
    let r = 0,
      c = get8();
    while (c & 0x80) {
      r = r | (c & 0x7f);
      r = r << 7;
      c = get8();
    }
    return r | c;
  }
  return {
    getc,
    get8,
    get16,
    read32String,
    get32,
    fstat,
    skip,
    getOffset,
    setOffset,
    readN,
    readNString,
    varLenInt,
  };
}
