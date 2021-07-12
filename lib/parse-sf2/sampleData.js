"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SampleData = void 0;

//@ts-ignore
class SampleData {
  constructor(rawData) {
    this.uint8s = rawData;
    this.floatArr = new SharedArrayBuffer(rawData.byteLength * 2);
    var dv2 = new DataView(this.floatArr);
    var dv = new DataView(this.uint8s.buffer);

    for (var i = 0; i < dv.byteLength / 2 - 1; i++) {
      dv2.setFloat32(i * 4, dv.getInt16(2 * i, true) / 0x7fff, true);
    }
  }

  sampleBuffer(_ref) {
    var {
      start,
      end,
      startLoop,
      endLoop
    } = _ref;
    var pitchRatio = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    var length = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 48000 * 3;
    var data = new Float32Array(this.floatArr);
    var loop = [startLoop - start, endLoop - start];

    function* shift() {
      var pos = 0x00;
      var n = 0;
      var shift = 0.0;

      while (n++ < length) {
        //@ts-ignore
        yield lerp(data[pos], data[pos + 1], shift);
        shift = shift + pitchRatio;

        while (shift >= 1) {
          shift--;
          pos++;
        }

        if (pos >= loop[1]) pos = loop[0];
        yield data[pos];
      }

      return data[pos];
    }

    return shift();
  }

}

exports.SampleData = SampleData;