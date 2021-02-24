"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAsCSV = exports.readMidiSSE = void 0;
const stream_1 = require("stream");
const load_sort_midi_1 = require("./load-sort-midi");
const readMidiSSE = ({ request, response, midifile, realtime, }) => {
    const rc = load_sort_midi_1.convertMidiRealTime(midifile);
    ["note", "#meta", "#time", "#tempo"].map((event) => {
        rc.emitter.on(event, (d) => {
            response.write(["event: ", event, "\n", "data: ", JSON.stringify(d), "\n\n"].join(""));
        });
    });
    return rc;
};
exports.readMidiSSE = readMidiSSE;
function readAsCSV(midifile) {
    let emitter, rc;
    if (typeof midifile !== "string") {
        emitter = midifile;
    }
    else {
        rc = load_sort_midi_1.convertMidiASAP(midifile);
        emitter = rc.emitter;
    }
    rc.start();
    const readable = new stream_1.Readable({ read: () => "" });
    emitter.on("note", (event) => {
        const { midi, name, instrument, ticks, durationTicks, velocity, noteOffVelocity, trackId, } = event;
        readable.push([
            ticks,
            midi,
            name,
            durationTicks,
            velocity * 127,
            noteOffVelocity * 127,
            instrument,
            trackId,
            instrument,
        ].join(",") + "\n");
    });
    emitter.on("#meta", (info) => {
        readable.push("#meta, " + JSON.stringify(info) + "\n");
    });
    emitter.on("#tempo", (info) => {
        readable.push("#tempo, " + JSON.stringify(info) + "\n");
    });
    emitter.on("ended", () => readable.emit("end"));
    return readable;
}
exports.readAsCSV = readAsCSV;
