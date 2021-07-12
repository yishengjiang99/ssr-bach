"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sfbkstream = sfbkstream;

var _aba = require("./aba.js");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function sfbkstream(_x) {
  return _sfbkstream.apply(this, arguments);
}

function _sfbkstream() {
  _sfbkstream = _asyncToGenerator(function* (url) {
    var ab = yield (yield fetch(url, {
      headers: {
        Range: 'bytes=0-6400'
      }
    })).arrayBuffer();
    var [preample, r] = skipToSDTA(ab);
    var sdtaSize = r.get32();
    var stdstart = r.offset + 8;
    var pdtastart = stdstart + sdtaSize + 4;
    var rangeHeader = {
      headers: {
        Range: 'bytes=' + stdstart + '-' + pdtastart
      }
    };
    var pdtaHeader = {
      headers: {
        Range: 'bytes=' + pdtastart + '-'
      }
    };
    var {
      readable,
      writable
    } = new TransformStream();
    (yield fetch(url, rangeHeader)).body.pipeTo(writable);
    return {
      nsamples: (pdtastart - stdstart) / 2,
      sdtaStream: readable,
      infos: preample,
      pdtaBuffer: new Uint8Array(yield (yield fetch(url, pdtaHeader)).arrayBuffer())
    };
  });
  return _sfbkstream.apply(this, arguments);
}

function skipToSDTA(ab) {
  var infosection = new Uint8Array(ab);
  var r = (0, _aba.readAB)(infosection);
  var [riff, filesize, sig, list] = [r.readNString(4), r.get32(), r.readNString(4), r.readNString(4)];
  console.assert(riff == 'RIFF' && sig == 'sfbk');
  var infosize = r.get32();
  console.log(r.readNString(4), filesize, list, r.offset);
  console.log(infosize, r.offset);
  var infos = [];

  while (infosize >= 8) {
    var [section, size] = [r.readNString(4), r.get32()];
    infos.push({
      section,
      text: r.readNString(size)
    });
    infosize = infosize - 8 - size;
  }

  console.assert(r.readNString(4) == 'LIST');
  return [infos, r];
}