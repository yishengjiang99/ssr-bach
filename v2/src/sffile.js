"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
exports.__esModule = true;
exports.SF2File = void 0;
var pdta_1 = require("./pdta");
var reader_1 = require("./reader");
var assert_1 = require("assert");
var LUT_1 = require("./LUT");
var defaultBlockLength = 128;
var SF2File = /** @class */ (function () {
  function SF2File(path, sampleRate) {
    if (sampleRate === void 0) {
      sampleRate = 48000;
    }
    this.chanVols = new Array(16).fill(0);
    this._channels = new Array(16);
    var r = reader_1.reader(path);
    var i = 0;
    this.sampleRate = sampleRate;
    var size = r.get32();

    size -= 64;
    var sections = {};
    do {
      var sectionSize = r.get32();
      var section = r.read32String();
      size = size - sectionSize;
      if (section === "pdta") {
        sections.pdta = __assign({ offset: r.getOffset() }, pdta_1.parsePDTA(r));
      } else if (section === "sdta") {
        assert_1["default"](r.read32String(), "smpl");
        var nsamples = (sectionSize - 4) / 2;
        var floatBuffer = Buffer.allocUnsafe(nsamples * 4);
        var bit16s = r.readN(sectionSize - 4);
        for (var i_1 = 0; i_1 < nsamples; i_1++)
          floatBuffer.writeFloatLE(bit16s.readInt16LE(i_1 * 2) / 0x7fff, i_1 * 4);
        sections.sdta = {
          offset: r.getOffset(),
          data: floatBuffer,
          sectionSize: sectionSize,
        };
      } else {
        r.skip(sectionSize);
      }
    } while (size > 0);
    this.sections = sections;
  }
  SF2File.prototype.ccVol = function (c, v) {
    this.chanVols[c] = v;
  };
  Object.defineProperty(SF2File.prototype, "channels", {
    get: function () {
      return this._channels;
    },
    set: function (value) {
      this._channels = value;
    },
    enumerable: false,
    configurable: true,
  });
  Object.defineProperty(SF2File.prototype, "sampleRate", {
    get: function () {
      return this._sampleRate;
    },
    set: function (value) {
      this._sampleRate = value;
    },
    enumerable: false,
    configurable: true,
  });
  SF2File.fromBuffer = function (buffer) {};
  SF2File.prototype.findPreset = function (_a) {
    var bankId = _a.bankId,
      presetId = _a.presetId,
      key = _a.key,
      vel = _a.vel;
    var sections = this.sections;
    var noteHave =
      !sections.pdta.presets[bankId + ""] ||
      !sections.pdta.presets[bankId][presetId] ||
      !sections.pdta.presets[bankId][presetId].zones;
    if (noteHave) {
      console.log("no", bankId, presetId, key, vel);
      return null;
    }
    var presetZones = sections.pdta.presets[bankId][presetId].zones;
    for (var _i = 0, presetZones_1 = presetZones; _i < presetZones_1.length; _i++) {
      var z = presetZones_1[_i];
      if (!z.sample) continue;
      if (z.velRange.lo > vel || z.velRange.hi < vel) continue;
      if (z.keyRange.lo > key || z.keyRange.hi < key) continue;
      if (z.velRange.hi - z.velRange.lo > 77) continue;
      return z;
    }
    for (var _b = 0, presetZones_2 = presetZones; _b < presetZones_2.length; _b++) {
      var z = presetZones_2[_b];
      if (!z.sample) continue;
      if (z.velRange.lo > vel || z.velRange.hi < vel) continue;
      if (z.keyRange.lo > key || z.keyRange.hi < key) continue;
      return z;
    }
    return null;
  };
  SF2File.prototype.keyOn = function (_a, duration, channelId) {
    var bankId = _a.bankId,
      presetId = _a.presetId,
      key = _a.key,
      vel = _a.vel;
    var preset = this.findPreset({
      bankId: bankId,
      presetId: presetId,
      key: key,
      vel: vel,
    });
    var length = ~~(duration * this.sampleRate);
    var centiDB =
      preset.attenuation +
      LUT_1.LUT.velCB[this.chanVols[channelId]] +
      LUT_1.LUT.velCB[vel];
    this.channels[channelId] = {
      id: channelId,
      zone: preset,
      smpl: preset.sample,
      length: length,
      ratio: preset.pitchAjust(key, this.sampleRate),
      iterator: preset.sample.start,
      ztransform: function (x) {
        return x;
      },
      gain: LUT_1.LUT.cent2amp[~~centiDB],
      pan: preset.pan,
      envelopeIterator: null,
    };
    return this.channels[channelId];
  };
  SF2File.prototype.key = function (key, duration, presetId) {
    if (duration === void 0) {
      duration = 0.25;
    }
    if (presetId === void 0) {
      presetId = null;
    }
    if (presetId) this._lastPresetId = presetId;
    var channelId = 0;
    while (this.channels[channelId] && this.channels[channelId++].length > 10);
    return this.keyOn(
      { key: key, bankId: 0, vel: 60, presetId: this._lastPresetId || 0 },
      duration,
      channelId
    );
  };
  SF2File.prototype._render = function (channel, outputArr, blockLength, n) {
    var input = this.sections.sdta.data;
    var looper = channel.smpl.endLoop - channel.smpl.startLoop;
    var sample = channel.smpl;
    var shift = 0.0;
    var iterator = channel.iterator || channel.smpl.start;
    for (var offset = 0; offset < blockLength - 1; offset++) {
      assert_1["default"](iterator >= channel.smpl.start && iterator <= channel.smpl.end);
      var outputByteOffset = offset * Float32Array.BYTES_PER_ELEMENT * 2;
      var currentVal = outputArr.readFloatLE(outputByteOffset);
      var newVal = void 0;
      var _a = [-1, 0, 1, 2].map(function (i) {
          return input.readFloatLE((iterator + i) * 4);
        }),
        vm1 = _a[0],
        v0 = _a[1],
        v1 = _a[2],
        v2 = _a[3];
      //spline lerp found on internet
      newVal = hermite4(shift, vm1, v0, v1, v2);
      //   const envval = channel.envelopeIterator.next();
      var sum = currentVal + (newVal * channel.gain) / n;
      outputArr.writeFloatLE(sum * 0.98, outputByteOffset);
      outputArr.writeFloatLE(sum * 1.03, outputByteOffset + 4);
      shift += channel.ratio;
      while (shift >= 1) {
        iterator++;
        shift--;
      }
      if (channel.length > 0 && iterator >= sample.endLoop) {
        iterator -= looper;
      }
      if (iterator >= sample.end) return 0;
      channel.length--;
    }
    channel.iterator = iterator;
  };
  SF2File.prototype.render = function (blockSize) {
    var _this = this;
    var output = Buffer.alloc(blockSize * 4 * 2);
    this.channels = this.channels.filter(function (c) {
      return c && c.length > 0;
    });
    this.channels.map(function (c, i) {
      _this._render(c, output, blockSize, _this.channels.length);
    });
    return output;
  };
  return SF2File;
})();
exports.SF2File = SF2File;
function hermite4(frac_pos, xm1, x0, x1, x2) {
  var c = (x1 - xm1) * 0.5;
  var v = x0 - x1;
  var w = c + v;
  var a = w + v + (x2 - x0) * 0.5;
  var b_neg = w + a;
  return ((a * frac_pos - b_neg) * frac_pos + c) * frac_pos + x0;
}
