import { Reader } from './reader';
export function readAB(arb): Reader {
  /*  getc: () => number;
  get8: () => number;
  getS16: () => number;
  get16: () => number;

  read32String: () => string;
  get32: () => number;
  skip: (n: number) => void;
  getOffset: () => number;
  setOffset: (n: number) => void;
  readN: (n: number) => Buffer;
  readNString: (n: number) => string;
  varLenInt: () => number;
  getUint16: () => number;
  seekToString: (str: string) => number | false;
  fd: number;*/
  const u8b = new Uint8Array(arb);
  var offset = 0;
  const getChar = () => u8b[offset++];
  const getStr = (n) => {
    let str = '';
    let nullterm = 0;
    for (let i = 0; i < n; i++) {
      let c = getChar();
      if (c == 0x00) nullterm = 1;
      if (nullterm == 0) str += String.fromCharCode(c);
    }
    return str;
  };
  const getUint32 = () =>
    getChar() | (getChar() << 8) | (getChar() << 16) | (getChar() << 24);
  const getU16 = () => getChar() | (getChar() << 8);
  const getS16 = () => {
    const u16 = getU16();
    if (u16 & 0x8000) return -0x10000 + u16;
    else return u16;
  };
  return {
    skip: function (n) {
      offset = offset + n;
    },
    get8: getChar,
    get16: getU16,
    getS16,
    getc: getChar,
    getOffset: () => offset,
    readN: (n) => {
      const ret = u8b.slice(offset, n);
      offset += n;
      return ret;
    },
    read32String: () => getStr(4),
    varLenInt: () => {
      let v = 0;
      let n = getChar();
      v = n & 0x7f;
      while (n & 0x80) {
        n = getChar();
        v = (v << 7) | (n & 0x7f);
      }
      return n;
    },
    get32: getUint32,
    setOffset: (n) => {
      offset = n;
    },
    readNString: (n) => getStr(n),
    getUint16: getU16,
  };
}