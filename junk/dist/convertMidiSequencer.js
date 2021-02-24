"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMidiSequencer = void 0;
const load_sort_midi_1 = require("./load-sort-midi");
async function convertMidiSequencer({ file, output, page }) {
    const notesrec = [];
    const bitmap = [];
    page = page || 1;
    const controller = load_sort_midi_1.convertMidi(file, async (notes) => {
        notes.map((note) => notesrec.push({
            midi: note.midi,
            trackId: note.trackId,
            ticks: note.durationTicks / 256 / 8,
        }));
        const excelrow = new Array(88).fill('');
        for (let i = 0; i < notesrec.length; i++) {
            const note = notesrec[i];
            if (!note)
                continue;
            excelrow[note.midi - 21] = 1;
            note.ticks -= 256 / 8;
            if (note.ticks <= 0) {
                continue;
            }
        }
        while (notesrec[0] && notesrec[0].ticks <= 0)
            notesrec.shift();
        bitmap.push(excelrow);
        return .25;
    });
    ;
    controller.start();
    await new Promise(r => {
        controller.emitter.on("end", r);
        controller.emitter.on("#time", (info) => {
            if (info.seconds > page * 100) {
                controller.pause();
                r(1);
            }
        });
    });
    return bitmap;
}
exports.convertMidiSequencer = convertMidiSequencer;
