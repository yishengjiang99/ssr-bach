"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.build51 = exports.recordmic = exports.concatPlaylist = exports.concat = exports.demuxer_template = exports.fflists = exports.afadeout = exports.acopy = exports.filter = exports.outputFile = exports.outputFFPlay = exports.stdformat = exports.qclause = void 0;
exports.qclause = "-y -hide_banner -loglevel panic";
exports.stdformat = "-ac 2 -ar 48000 -f f32le";
const outputFFPlay = (format = "f32le") => `-f ${format} - |ffplay -i pipe:0 -f ${format}`;
exports.outputFFPlay = outputFFPlay;
const outputFile = (outputFileName) => `-f f32le ${outputFileName}`;
exports.outputFile = outputFile;
exports.filter = `-filter_complex0`;
exports.acopy = "-acodec copy";
exports.afadeout = `[0:a]afade=type=in:duration=1,afade=type=out:duration=1:start_time=9[a]`;
exports.fflists = [`ffmpeg --list-demuxers`];
const demuxer_template = (demuxer, input) => `ffmpeg -f ${demuxer} -i ${input}`;
exports.demuxer_template = demuxer_template;
exports.concat = `-af concat -i playlist.txt`;
exports.concatPlaylist = `\
ffconcat version 1.0
file file-1.wav
duration 20.0
inpoint 11.2
output 1.2

file subdir/file-2.wav
file file3`;
exports.recordmic = "ffmpeg -re -f avfoundation -i :1 -f mpegts output.ts";
function build51(...inputs) {
    const [fl, fr, fc, sl, sr, lfe] = inputs;
    `ffmpeg -i fl -i fr -i fc -i sl -i sr -i lfe -filter_complex
'join=inputs=6:channel_layout=5.1:map=0.0-FL|1.0-FR|2.0-FC|3.0-SL|4.0-SR|5.0-LFE'
out`;
}
exports.build51 = build51;
