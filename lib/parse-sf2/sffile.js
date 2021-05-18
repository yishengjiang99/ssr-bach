"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SF2File = void 0;

var _aba = require("./aba.js");

var _pdta = require("./pdta.js");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

class SF2File {
  constructor(ab) {
    var _this = this;

    var r = (0, _aba.readAB)(ab);
    console.assert(r.read32String() == "RIFF");
    var size = r.get32();
    console.assert(r.read32String() == "sfbk");
    console.assert(r.read32String() == "LIST");
    size -= 64;
    var sections = {};

    do {
      var sectionSize = r.get32();
      var section = r.read32String();
      size = size - sectionSize;

      if (section === "pdta") {
        this.pdta = new _pdta.PDTA(r);
      } else if (section === "sdta") {
        (function () {
          console.assert(r.read32String() == "smpl");
          var nsamples = (sectionSize - 4) / 2;
          var uint8s = r.readN(sectionSize - 4);
          var floatArr = new SharedArrayBuffer(uint8s.byteLength * 2);
          var dv2 = new DataView(floatArr);
          var dv = new DataView(uint8s.buffer);

          for (var i = 0; i < dv.byteLength / 2 - 1; i++) {
            dv2.setFloat32(i * 4, dv.getInt16(2 * i, true) / 0x7fff, true);
          }

          function iterate(zone, key, outputSampleRate) {
            var length = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 48000 * 2;
            var data = new Float32Array(floatArr);
            var {
              start,
              end,
              startLoop,
              endLoop
            } = zone.sample;
            var loop = [startLoop - start, endLoop - start];
            var pitchRatio = Math.pow(2, (key * 100 - zone.pitch) / 1200) * zone.sample.sampleRate / outputSampleRate;

            function* shift() {
              var pos = 0x00;
              var n = 0;
              var shift = 0.0;

              while (n++ < length) {
                yield data[pos];
                shift = shift + pitchRatio;

                while (shift >= 1) {
                  shift--;
                  pos++;
                }

                if (pos >= loop[1]) pos = loop[0];
              }

              return data[pos];
            }

            return shift();
          }

          _this.sdta = {
            nsamples,
            data: uint8s,
            floatArr: floatArr,
            iterator: iterate
          };
        })();
      } else {
        r.skip(sectionSize);
      }
    } while (size > 0);
  }

}

exports.SF2File = SF2File;

SF2File.fromURL = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(function* (url) {
    return new SF2File(yield (yield fetch(url)).arrayBuffer());
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();