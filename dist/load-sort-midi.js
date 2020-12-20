"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secondsPerTick = exports.msPerBeat = exports.convertMidiASAP = exports.convertMidiRealTime = exports.convertMidi = void 0;
const midi_1 = require("@tonejs/midi");
const events_1 = require("events");
const utils_1 = require("./utils");
function convertMidi(source, cb) {
    const emitter = new events_1.EventEmitter();
    const { tracks, header } = new midi_1.Midi(require("fs").readFileSync(source));
    const tempos = JSON.parse(JSON.stringify(header.tempos));
    const state = {
        paused: true,
        time: 0,
        stop: false,
        midifile: source,
        tempo: tempos[0],
        timeSignature: header.timeSignatures[0],
    };
    emitter.emit("#tempo", state.tempo.bpm, state.timeSignature.timeSignature);
    const setCallback = (_cb) => (cb = _cb);
    const setState = (update) => {
        Object.keys(update).forEach((k) => (state[k] = update[k]));
    };
    const controller = {
        pause: () => setState({ paused: true }),
        resume: () => {
            emitter.emit("resume");
            setState({ paused: false });
        },
        stop: () => setState({ stop: true }),
        ff: () => setState({ time: state.time + 15 }),
        next: () => { },
        rwd: () => setState({ time: Math.max(state.time - 15, 0) }),
        emitter: emitter,
        start: () => {
            setState({ paused: false });
            pullMidiTrack(tracks, cb);
        },
        setCallback,
        state,
    };
    const pullMidiTrack = async (tracks, _cb) => {
        let done = 0;
        console.log("start");
        let doneSet = new Set();
        setState({ t0: process.uptime() });
        // const ticksPerSecond = (state.tempo.bpm / 60) * header.ppq;
        while (tracks.length > done) {
            const notesstarting = [];
            const currentTick = header.secondsToTicks(state.time);
            console.log(currentTick);
            for (let i = 0; i < tracks.length; i++) {
                if (doneSet.has(i))
                    continue;
                if (!tracks[i].notes || tracks[i].notes.length === 0) {
                    doneSet.add(i);
                    done++;
                    continue;
                }
                if (tracks[i].notes[0] && tracks[i].notes[0].ticks <= currentTick) {
                    const note = tracks[i].notes.shift();
                    const noteEvent = {
                        ...note,
                        trackId: i,
                        start: header.ticksToSeconds(note.ticks),
                        durationTime: exports.secondsPerTick(state.tempo.bpm) * note.durationTicks,
                        velocity: note.velocity * 0x7f,
                        instrument: format(tracks[i].instrument.name),
                    };
                    notesstarting.push(noteEvent);
                    emitter.emit("note", noteEvent);
                }
                if (tempos[1] && currentTick >= tempos[1].ticks) {
                    tempos.shift();
                    state.tempo = tempos[0];
                    emitter.emit("#tempo", { bpm: state.tempo.bpm });
                }
            }
            state.time += await _cb(notesstarting);
            console.log(state.time, state.stop, state.paused);
            if (state.paused) {
                await new Promise((resolve) => {
                    emitter.on("resume", resolve);
                });
            }
            if (state.stop)
                break;
        }
        emitter.emit("ended");
    };
    return controller;
}
exports.convertMidi = convertMidi;
exports.convertMidiRealTime = (file) => {
    const controller = convertMidi(file, async function () {
        await utils_1.sleep(10); //achieves real tiem by asking 'is it next beat yet every 10 ms
        return 0.01;
    });
    controller.start();
    return controller;
};
exports.convertMidiASAP = (file) => {
    const controller = convertMidi(file, async function () {
        console.log("pullcb");
        await utils_1.sleep(0); //achieves real tiem by asking 'is it next beat yet every 10 ms
        return exports.msPerBeat(controller.state.tempo.bpm) / 1000;
    });
    controller.start();
    return controller;
};
exports.msPerBeat = (bpm) => 60000 / bpm;
exports.secondsPerTick = (bpm) => 60 / bpm / 256;
function format(str) {
    return str.replace(" ", "_").replace(" ", "_").replace(" ", "_").replace(" ", "_");
}
//convertMidiRealTime("./midi/song").emitter.on("note", console.log);
//# sourceMappingURL=load-sort-midi.js.map