"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMidi = void 0;
const midi_1 = require("@tonejs/midi");
const events_1 = require("events");
const utils_1 = require("./utils");
function convertMidi(source, realtime) {
    const emitter = new events_1.EventEmitter();
    const { tracks, header } = new midi_1.Midi(require("fs").readFileSync(source));
    const state = {
        paused: false,
        time: 0,
        ticks: 0,
        measure: 0,
        stop: false,
        midifile: source,
        tempo: header.tempos[0].bpm,
        timeSignature: header.timeSignatures[0].timeSignature,
    };
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
        emitter,
        state,
    };
    const pullMidiTrack = async (tracks, cb) => {
        console.log("start");
        const { beatLengthMs, ticksPerbeat } = currentTempo(state.ticks);
        let done = 0;
        let doneSet = new Set();
        while (tracks.length > done) {
            for (let i = 0; i < tracks.length; i++) {
                if (doneSet.has(i))
                    continue;
                if (!tracks[i].notes || tracks[i].notes.length === 0) {
                    doneSet.add(i);
                    done++;
                    continue;
                }
                while (tracks[i].notes[0] && tracks[i].notes[0].ticks <= state.time) {
                    emitter.emit("note", {
                        ...tracks[i].notes.shift(),
                        trackId: i,
                        instrument: format(tracks[i].instrument.name),
                    });
                }
            }
            await cb();
            if (state.stop)
                break;
        }
        emitter.emit("ended");
    };
    function currentTempo(now) {
        let shifted = 0;
        if (header.tempos[1] && now >= header.tempos[0].ticks) {
            header.tempos.shift();
            shifted = 1;
        }
        if (header.timeSignatures[1] && now >= header.timeSignatures[0].ticks) {
            header.timeSignatures.shift();
            shifted = 1;
        }
        let ppb = header.ppq;
        let bpm = (header.tempos && header.tempos[0] && header.tempos[0].bpm) || 120;
        let signature = (header.timeSignatures &&
            header.timeSignatures[0] &&
            header.timeSignatures[0].timeSignature) || [4, 4];
        let beatLengthMs = 60000 / header.tempos[0].bpm;
        let ticksPerbeat = header.ppq;
        const beatResolution = signature[1];
        const quarterNotesInBeat = signature[0];
        if (shifted || now === 0) {
            emitter.emit("#tempo", { bpm, ticksPerbeat, beatLengthMs });
        }
        return {
            ppb,
            bpm,
            ticksPerbeat,
            signature,
            beatLengthMs,
            beatResolution,
            quarterNotesInBeat,
        };
    }
    const callback = async () => {
        const { beatLengthMs, ticksPerbeat } = currentTempo(state.ticks);
        if (realtime)
            await utils_1.sleep(beatLengthMs / 4);
        else
            await utils_1.sleep(0);
        setState({
            ticks: state.ticks + ticksPerbeat / 4,
            time: state.time + beatLengthMs / 4,
        });
        if (state.paused) {
            await new Promise((resolve) => {
                emitter.on("resume", resolve);
            });
        }
        emitter.emit("#time", [state.time, state.ticks]);
        currentTempo(state.ticks);
        return ticksPerbeat;
    };
    emitter.emit("#meta", "startingno");
    currentTempo(0);
    emitter.emit("#meta", "debug");
    pullMidiTrack(tracks, callback);
    return controller;
}
exports.convertMidi = convertMidi;
function format(str) {
    return str
        .replace(" ", "_")
        .replace(" ", "_")
        .replace(" ", "_")
        .replace(" ", "_");
}
//# sourceMappingURL=load-sort-midi.js.map