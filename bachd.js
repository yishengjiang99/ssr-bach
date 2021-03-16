'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const stream_1 = require('stream');
const cspawn_1 = require('./dist/cspawn');
const load_midi_1 = require('./dist/load-midi');
const sffile_1 = require('./dist/sffile');
const resolve = require('path').resolve;
const pt = new stream_1.PassThrough();

const song = resolve('song.mid');
const sff = resolve('file.sf2');
const ffp_binary = resolve('./ffplay');

const { tracks, loop } = load_midi_1.loadMidi({
  source: process.argv[2] || song,
  sff: new sffile_1.SF2File(process.argv[3] || sff, 24000),
  output: cspawn_1.cspawn(
    ffp_binary + ' -f f32le -ac 2 -ar 24000 -i pipe:0 -nodisp -loglevel panic'
  ).stdin,
  sampleRate: 24000,
});
loop();
