export function readAB(arb) {
  const u8b = new Uint8Array(arb);
  var offset = 0;
  const getChar = () => u8b[offset++];
  const getStr = (n) => {
    let str = "";
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
    ftell: () => offset,
    skip: function (n) {
      offset = offset + n;
    },
    getChar,
    getStr,
    getUint32,
    getU16,
    getS16,
  };
}
