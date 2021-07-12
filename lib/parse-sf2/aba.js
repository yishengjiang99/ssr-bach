"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readAB = readAB;

function readAB(arb) {
  var u8b = new Uint8Array(arb);
  var _offset = 0;

  function get8() {
    return u8b[_offset++];
  }

  function getStr(n) {
    var str = '';
    var nullterm = 0;

    for (var i = 0; i < n; i++) {
      var c = get8();
      if (c == 0x00) nullterm = 1;
      if (nullterm == 0) str += String.fromCharCode(c);
    }

    return str;
  }

  function get32() {
    return get8() | get8() << 8 | get8() << 16 | get8() << 24;
  }

  var get16 = () => get8() | get8() << 8;

  var getS16 = () => {
    var u16 = get16();
    if (u16 & 0x8000) return -0x10000 + u16;else return u16;
  };

  var readN = n => {
    var ret = u8b.slice(_offset, n);
    _offset += n;
    return ret;
  };

  function varLenInt() {
    var v = 0;
    var n = get8();
    v = n & 0x7f;

    while (n & 0x80) {
      n = get8();
      v = v << 7 | n & 0x7f;
    }

    return n;
  }

  var skip = n => {
    _offset = _offset + n;
  };

  var read32String = () => getStr(4);

  var readNString = n => getStr(n);

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
    }

  };
} // const r = readAB([1, 2, 3, 4, 4, 4, 4, 5, 5, 2, 3, 3, 4]);
// r.get16();
// r.get8();
// r.read32String();
// console.log(r.offset);