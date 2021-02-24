"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pcm2png = void 0;
const cspawn_1 = require("./cspawn");
const ffmpeg_templates_1 = require("./ffmpeg-templates");
const pcm2png = (buffer) => {
    return cspawn_1.cspawn(`ffmpeg ${ffmpeg_templates_1.stdformat} -i pipe:0 -filter_complex "showwavespic=s=640x120" -frames:v 1 -`).stdout;
};
exports.pcm2png = pcm2png;
