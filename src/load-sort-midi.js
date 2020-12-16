"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.convertMidi = void 0;
var midi_1 = require("@tonejs/midi");
var events_1 = require("events");
var utils_1 = require("./utils");
function convertMidi(source, realtime) {
    var _this = this;
    var emitter = new events_1.EventEmitter();
    var _a = new midi_1.Midi(require("fs").readFileSync(source)), tracks = _a.tracks, header = _a.header;
    var state = {
        paused: false,
        time: 0,
        midifile: source,
        tempo: null,
        timeSignature: null
    };
    var setState = function (update) {
        Object.keys(update).forEach(function (k) { return (state[k] = update[k]); });
    };
    var controller = {
        pause: function () { return setState({ paused: true }); },
        resume: function () {
            emitter.emit("resume");
            setState({ paused: false });
        },
        ff: function () { return setState({ time: state.time + 15 }); },
        next: function () { },
        rwd: function () { return setState({ time: Math.max(state.time - 15, 0) }); },
        emitter: emitter
    };
    function pullMidiTrack(tracks, cb) {
        return __awaiter(this, void 0, void 0, function () {
            var done, doneSet, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        done = 0;
                        doneSet = new Set();
                        _a.label = 1;
                    case 1:
                        if (!tracks.length) return [3 /*break*/, 3];
                        for (i = 0; i < tracks.length; i++) {
                            if (!tracks[i].notes || tracks[i].notes.length === 0) {
                                tracks.splice(i);
                                continue;
                            }
                            if (tracks[i].notes[0].ticks <= state.time) {
                                emitter.emit("note", __assign(__assign({}, tracks[i].notes.shift()), { trackId: i, instrument: format(tracks[i].instrument.name) }));
                            }
                        }
                        return [4 /*yield*/, cb()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 3:
                        emitter.emit("ended");
                        return [2 /*return*/];
                }
            });
        });
    }
    function currentTempo(now) {
        if (!state.tempo || (header.tempos[0] && now >= header.tempos[0].ticks)) {
            state.tempo = header.tempos.shift();
            emitter.emit("#tempo", state.tempo);
        }
        if (!state.timeSignature ||
            (header.timeSignatures[0] && now >= header.timeSignatures[0].ticks)) {
            state.timeSignature = header.timeSignatures.shift().timeSignature;
            emitter.emit("#timeSignature", state.timeSignature);
        }
    }
    var callback = function () { return __awaiter(_this, void 0, void 0, function () {
        var beatLengthMs, ticksPerbeat;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    beatLengthMs = 60000 / state.tempo.bpm;
                    ticksPerbeat = (header.ppq / state.timeSignature[1]) * 4;
                    if (!state.paused) return [3 /*break*/, 2];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            emitter.on("resume", resolve);
                        })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (!(state.time >= 0 && realtime)) return [3 /*break*/, 4];
                    return [4 /*yield*/, utils_1.sleep(beatLengthMs / state.timeSignature[1] / 4)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    emitter.emit("#time", header.ticksToMeasures(state.time));
                    setState({
                        time: state.time + (ticksPerbeat / state.timeSignature[1]) * 4
                    });
                    currentTempo(state.time);
                    return [2 /*return*/, ticksPerbeat];
            }
        });
    }); };
    currentTempo(state.time);
    pullMidiTrack(tracks, callback);
    return controller;
}
exports.convertMidi = convertMidi;
function format(str) {
    return (str
        .replace(" ", "_")
        .replace(" ", "_")
        .replace(" ", "_")
        .replace(" ", "_") + "\t");
}
// const { emitter } = convertMidi("./Beethoven-Symphony5-1.mid", true);
// emitter.on("note", console.log);
