export type Reader = {
  getc: () => number;
  get8: () => number;
  getS16: () => number;
  get16: () => number;

  read32String: () => string;
  get32: () => number;
  skip: (n: number) => void;
  getOffset: () => number;
  setOffset: (n: number) => void;

  varLenInt: () => number;
  getUint16: () => number;
  seekToString: (str: string) => number | false;
};
export const LE = 0x00;
export const BE = 0x01;
const endmask = 0x01;

export function reader(arr: Uint8Array, le: boolean = true): Reader {
  let offset: number = 0;
  let size = arr.length;
  function seekToString(str) {
    let m = 0;
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
    return arr[offset++];
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
    return get8() | (get8() << 8);
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

    skip,
    getOffset,
    setOffset,
    getUint16,
    varLenInt,
  };
}
