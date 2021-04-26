export interface IReadAB {
  skip: (arg0: number) => void;
  get8: () => number;
  get16: () => number;
  getS16: () => number;
  readN: (n: number) => Uint8Array;
  read32String: () => string;
  varLenInt: () => number;
  get32: () => number;
  readNString: (arg0: number) => string;
  offset: number;
}

export function readAB(arb: ArrayBuffer | Uint8Array): IReadAB {
  const u8b = new Uint8Array(arb);
  let _offset = 0;
  function get8() {
    return u8b[_offset++];
  }
  function getStr(n: number) {
    let str = '';
    let nullterm = 0;
    for (let i = 0; i < n; i++) {
      const c = get8();
      if (c == 0x00) nullterm = 1;
      if (nullterm == 0) str += String.fromCharCode(c);
    }
    return str;
  }
  function get32() {
    return get8() | (get8() << 8) | (get8() << 16) | (get8() << 24);
  }
  const get16 = () => get8() | (get8() << 8);
  const getS16 = () => {
    const u16 = get16();
    if (u16 & 0x8000) return -0x10000 + u16;
    else return u16;
  };
  const readN = (n: number) => {
    const ret = u8b.slice(_offset, n);
    _offset += n;
    return ret as Uint8Array;
  };
  function varLenInt() {
    let v = 0;
    let n = get8();
    v = n & 0x7f;
    while (n & 0x80) {
      n = get8();
      v = (v << 7) | (n & 0x7f);
    }
    return n;
  }
  const skip = (n: number) => {
    _offset = _offset + n;
  };
  const read32String = () => getStr(4);
  const readNString = (n: number) => getStr(n);
  return {
    skip,
    get8,
    get16,
    getS16,
    readN,
    read32String,
    varLenInt,
    get32,
    readNString,
    get offset() {
      return _offset;
    },
    set offset(n) {
      _offset = n;
    },
  };
}

// const r = readAB([1, 2, 3, 4, 4, 4, 4, 5, 5, 2, 3, 3, 4]);
// r.get16();
// r.get8();
// r.read32String();
// console.log(r.offset);
