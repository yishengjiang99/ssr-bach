"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.streamSF2File = streamSF2File;

var _sfbkstream = require("./sfbkstream.js");

var _pdta = require("./pdta.js");

var _aba = require("./aba.js");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function streamSF2File(_x) {
  return _streamSF2File.apply(this, arguments);
}

function _streamSF2File() {
  _streamSF2File = _asyncToGenerator(function* (file) {
    var {
      pdtaBuffer,
      sdtaStream,
      nsamples,
      infos
    } = yield (0, _sfbkstream.sfbkstream)(file);
    var pdta = new _pdta.PDTA((0, _aba.readAB)(pdtaBuffer));
    var samplesData = pdta.shdr.map((sh, idx) => _objectSpread(_objectSpread({}, sh), {}, {
      sid: idx,
      izones: pdta.ibag.filter(ib => ib.izone.sampleID == idx)
    }));
    var readable = new ReadableStream({
      start(controller) {
        return _asyncToGenerator(function* () {
          controller.enqueue(JSON.stringify(infos));
        })();
      }

    });
    var sampleIdx;
    var reader = sdtaStream.getReader();
    var floats = new Float32Array(nsamples);
    var sampleOffset = 0;
    var sampleData = [];

    function createSamplebuffer() {
      var sample = pdta.shdr[sampleOffset];
      sampleData[sampleOffset].ab = new AudioBuffer({
        numberOfChannels: 1,
        length: sample.end - sample.start,
        sampleRate: sample.sampleRate
      });
      sampleData[sampleOffset].loop = [sample.startLoop - sample.start, sample.end - sample.end];
      var floatss = sampleData[sampleOffset].ab.getChannelData(0);
      return [floatss, floatss.length];
    }

    var [floatss, nsample] = createSamplebuffer();
    var offset = 0;

    while (true) {
      var {
        done,
        value
      } = yield reader.read();
      if (done) break;
      var dv = new DataView(value.buffer);

      for (var i = 0; i < value.byteLength / 2 - 1; i++) {
        floatss[offset++] = dv.getInt16(2 * i, true) / 0x7fff; // / 0x7fff;

        if (offset >= nsample) {
          if (sampleOffset >= pdta.shdr.length) return;
          [floatss, nsample] = createSamplebuffer();
          offset = 0;
        }
      }
    }
  });
  return _streamSF2File.apply(this, arguments);
}