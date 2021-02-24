"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const read_midi_sse_csv_1 = require("./read-midi-sse-csv");
const utils_1 = require("./utils");
if (utils_1.isMain() && process.argv[2]) {
    read_midi_sse_csv_1.readAsCSV(process.argv[2]).pipe(process.stdout);
}
