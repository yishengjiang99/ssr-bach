"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.loadMidi = exports.loadMidiaa = void 0;
var midi_1 = require("@tonejs/midi");
var fs_1 = require("fs");
var midi_chan_vol_cc = 11;
var midi_mast_vol_cc = 7;
function loadMidiaa(source, sff, output, sampleRate) {
    return loadMidi({ source: source, sff: sff, output: output, sampleRate: sampleRate });
}
exports.loadMidiaa = loadMidiaa;
function loadMidi(_a) {
    var source = _a.source, sff = _a.sff, output = _a.output, sampleRate = _a.sampleRate, debug = _a.debug;
    var _b = new midi_1.Midi(fs_1.readFileSync(source)), totalTicks = _b.durationTicks, tracks = _b.tracks, header = _b.header;
    var tempos = header.tempos;
    var now = 0;
    var bpm = (tempos && tempos[0] && tempos[0].bpm) || 120;
    function registerNote(t, note) {
        return sff.keyOn({
            bankId: t.instrument.percussion ? 128 : 0,
            presetId: 0,
            key: note.midi,
            vel: note.velocity * 0x7f
        }, note.duration, t.channel);
    }
    var ticksPerQuarterNote = header.ppq; // this is equivalent to a 1/4 note.
    var activeTracks = tracks;
    var framesize = 128; //for 350fps
    function loop(bitdepth) {
        if (bitdepth === void 0) { bitdepth = 32; }
        return __awaiter(this, void 0, void 0, function () {
            var loopStart, nextCycleStart, notesPlayed, _i, activeTracks_1, t, note, milisecondsToNextCycle, framesToREnder, b, elapsedCycleTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loopStart = process.uptime();
                        if (now > totalTicks)
                            return [2 /*return*/];
                        if (tempos.length > 1 && now >= tempos[1].ticks) {
                            tempos.shift();
                            bpm = tempos[0].bpm;
                        }
                        nextCycleStart = null;
                        notesPlayed = [];
                        for (_i = 0, activeTracks_1 = activeTracks; _i < activeTracks_1.length; _i++) {
                            t = activeTracks_1[_i];
                            if (t.controlChanges &&
                                t.controlChanges[midi_chan_vol_cc] &&
                                t.controlChanges[midi_chan_vol_cc].length &&
                                now >= t.controlChanges[midi_chan_vol_cc][0].ticks) {
                                sff.ccVol(t.channel, t.controlChanges[midi_chan_vol_cc][0].value);
                                t.controlChanges[midi_chan_vol_cc].shift();
                            }
                            while (t.notes.length && t.notes[0].ticks <= now) {
                                note = t.notes.shift();
                                notesPlayed.push(registerNote(t, note));
                                // if (!nextCycleStart) nextCycleStart = t.notes[0].duration;
                            }
                            if (t.notes.length) {
                                nextCycleStart = !nextCycleStart
                                    ? t.notes[0].ticks
                                    : Math.min(nextCycleStart, t.notes[0].ticks);
                            }
                        }
                        if (notesPlayed.length) {
                        }
                        milisecondsToNextCycle = (nextCycleStart - now) * (60000 / bpm / ticksPerQuarterNote);
                        framesToREnder = (milisecondsToNextCycle * sampleRate) / 1000;
                        b = framesToREnder;
                        while (framesToREnder >= 2 * framesize) {
                            if (!output.destroyed)
                                output.write(sff.render(2 * framesize));
                            framesToREnder -= 2 * framesize;
                        }
                        if (!output.destroyed)
                            output.write(sff.render(framesize));
                        elapsedCycleTime = process.uptime() - loopStart;
                        if (elapsedCycleTime * 1000 > milisecondsToNextCycle) {
                            console.error("LAG!!");
                            // framesize += 20;
                            // if (framesize > 1280) throw "find a new outlet";
                        }
                        console.log("frames:", b);
                        console.log("took (ms)", elapsedCycleTime * 1000);
                        console.log("sleep", milisecondsToNextCycle);
                        return [4 /*yield*/, new Promise(function (resolve) {
                                return setTimeout(resolve, milisecondsToNextCycle - elapsedCycleTime * 1000);
                            })];
                    case 1:
                        _a.sent();
                        now = nextCycleStart;
                        if (nextCycleStart == null) {
                            output.end();
                            return [2 /*return*/];
                        }
                        loop();
                        return [2 /*return*/];
                }
            });
        });
    }
    return { tracks: tracks, header: header, loop: loop };
}
exports.loadMidi = loadMidi;
