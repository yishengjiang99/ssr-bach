"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const read_midi_sse_csv_1 = require("./read-midi-sse-csv");
const stream_1 = require("stream");
test("csv/sse", (done) => {
    const rc = read_midi_sse_csv_1.readMidiSSE({
        midifile: "./midi/song.mid",
        response: new stream_1.Writable({
            write: (chunk) => {
                rc.stop();
                expect(chunk).toBeTruthy();
                rc.stop();
                done();
            },
        }),
        request: null,
        realtime: false,
    });
});
