"use strict";
exports.__esModule = true;
exports.LUT = void 0;
var LUT = /** @class */ (function () {
    function LUT() {
    }
    LUT.init = function () {
        LUT.cent2amp = [];
        for (var i = 0; i < 1441; i++) {
            LUT.cent2amp[i] = Math.pow(10, i / -200.0);
        }
        LUT.velCB = new Array(128);
        LUT.velCB[0] = 0.0;
        LUT.velCB[127] = 1.0;
        for (var i = 1; i < 127; i++) {
            LUT.velCB[i] = ((-200.0 / 960) * Math.log((i * i) / (127 * 127))) / Math.log(10);
        }
        for (var n = 0; n < 2400; n++) {
            LUT.relPC[n] = Math.pow(2.0, (n - 1200.0) / 1200.0);
        }
        for (var n = 0; n < 128; n++) {
            LUT.frqST[n] = 440 * Math.pow(2, (n - 69) / 12.0);
        }
        for (var n = 1; n < 128; n++) {
            LUT.midiCB[n] = (-20 / 96) * Math.log10((127 * 127) / (n * n));
        }
    };
    LUT.relPC = [];
    LUT.frqST = [];
    LUT.midiCB = [];
    LUT.velCB = [];
    LUT.cent2amp = [];
    return LUT;
}());
exports.LUT = LUT;
LUT.init();
// console.log(LUT.velCB);
// console.log(LUT.cent2amp);
// console.log(1 - LUT.velCB[33] - LUT.velCB[100]);
