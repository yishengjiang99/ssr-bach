export function readAB(arb) {
  const u8b = new Uint8Array(arb);
  let offset = 0;
  const get8 = () => {
    return u8b[offset++];
  };
  const getStr = (n) => {
    let str = '';
    let nullterm = 0;
    for (let i = 0; i < n; i++) {
      let c = get8();
      if (c == 0x00) nullterm = 1;
      if (nullterm == 0) str += String.fromCharCode(c);
    }
    return str;
  };
  const getUint32 = () =>
    get8() | (get8() << 8) | (get8() << 16) | (get8() << 24);
  const getU16 = () => get8() | (get8() << 8);
  const getS16 = () => {
    const u16 = getU16();
    if (u16 & 0x8000) return -0x10000 + u16;
    else return u16;
  };
  return {
    offset,

    skip: function (n) {
      offset = offset + n;
    },
    get8,
    get16: getU16,
    getS16,
    readN: (n) => {
      const ret = u8b.slice(offset, n);
      offset += n;
      return ret as Uint8Array;
    },
    read32String: () => getStr(4),
    varLenInt: () => {
      let v = 0;
      let n = get8();
      v = n & 0x7f;
      while (n & 0x80) {
        n = get8();
        v = (v << 7) | (n & 0x7f);
      }
      return n;
    },
    get32: getUint32,

    readNString: (n) => getStr(n),
    getUint16: getU16,
  };
}
