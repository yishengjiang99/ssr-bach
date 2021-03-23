import { FILE } from 'dns';
import { openSync, readSync, Stats, statSync } from 'fs';
import { keys } from './utilv1';
export type Reader = {
  getc: () => number;
  get8: () => number;
  getS16: () => number;
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
  getUint16: () => number;
  seekToString: (str: string) => number | false;
};
export const LE = 0x00;
export const BE = 0x01;
const endmask = 0x01;
export function reader(path: string, opts: number = 0): Reader {
  let offset: number = 0;
  const le = (opts & endmask) == 0;
  const fd = openSync(path, 'r');
  function seekToString(str) {
    let m = 0;
    const size = fstat().size;
    while (offset < size) {
      const c = getc();
      if (c == str.charCodeAt(m)) {
        m++;
        if (m == str.length) return offset;
        else {
          console.log(m);
        }
      }
    }
    return false;
  }
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
  const getS16 = function (): number {
    let amt = get8() | (get8() << 8);
    if (amt & 0x8000) amt = -0x10000 + amt;
    return amt;
  };
  const getUint16 = function (): number {
    const buffer: Buffer = Buffer.alloc(8);
    readSync(fd, buffer, 0, 4, offset);
    offset += 2;
    return buffer.readUInt16LE();
  };
  const get32 = function (): number {
    return (getc() | (getc() << 8) | (getc() << 16) | (getc() << 24)) >>> 0; //_
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
    seekToString,
    getc,
    get8,
    getS16,
    get16,
    read32String,
    get32,
    fstat,
    skip,
    getOffset,
    setOffset,
    getUint16,
    readN,
    readNString,
    varLenInt,
  };
}
