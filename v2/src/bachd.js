const { tracks, loop } = loadMidi2({
  source: "./1.mid",
  sff: sffile,
  output: devnull(),
  sampleRate: 48000,
  debug: true,
});
loop();
