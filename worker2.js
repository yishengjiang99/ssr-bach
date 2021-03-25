c                       Module.addOnInit(async function () {
  Module._initWithPreload();
  postMessage('init');
  let trackListPtr = Module._malloc(sizeof_track_t * polyphony);
  tvs = [];
  for (let i = 0; i < 16; i++) {
    const tv = new TrackView(
      trackListPtr + i * sizeof_track_t,
      new DataView(
        Module.HEAPU8.buffer,
        trackListPtr + i * sizeof_track_t,
        sizeof_track_t
      )
    );
    tv.length = 0;
    tvs.push(tv);
  }
  renderFn = function () {
    const n = 128 * Float32Array.BYTES_PER_ELEMENT;
    const output = Module._malloc(n);
    Module._render(output, trackListPtr);
    const data = new Float32Array(Module.HEAPF32.buffer, output, n);

    Module._free(output);
  };
});

function stagePreset(track, note, duration) {
  //presetId, bankId, key, velocity) {
  const index = presetIndex(track);
  Module.trackInfo(track.instrument.number, note.midi, note.velocity);
  length = ~~(duration * 48000);

  const preset = trackInfo[index].zones.filter(
    (t) =>
      t.velRange.lo < note.velocity * 0x7f &&
      t.velRange.hi >= note.velocity * 0x7f &&
      t.keyRange.hi >= note.midi &&
      t.keyRange.lo <= note.midi
  )[0];

  if (preset && preset.sample) {
    const ratio =
      (Math.pow(2, (preset.sample.originalPitch - note.midi) / 12) * 48000) /
      preset.sample.sampleRate;
    const tv = tvs[track.instrument.channel];
    const { start, end, startLoop, endLoop } = preset.sample;
    tv.length = length;
    tv.offset = start;
    tv.end = end;
    tv.startLoop = startLoop;
    tv.endLoop = endLoop;
    tv.ratio = ratio;
  }
}

function omsg(msg) {
  switch (msg) {
    case 'done':
      clearInterval(timer);
      break;
    default:
      break;
  }
}
class TrackView {
  constructor(ptr, dv) {
    this.ptr = ptr;
    this.dv = dv;
  }
  get length() {
    return this.dv.getUint16(0);
  }
  set length(n) {
    this.dv.setUint16(0, n);
  }
  get offset() {
    return this.dv.getUint32(2);
  }
  set offset(n) {
    this.dv.setUint32(2, n);
  }
  get end() {
    return this.dv.getUint32(6);
  }
  set end(n) {
    this.dv.setUint32(6, n);
  }
  get startLoop() {
    return this.dv.getUint32(10);
  }
  set startLoop(n) {
    this.dv.setUint32(10, n);
  }
  get endLoop() {
    return this.dv.getUint32(14);
  }
  set endLoop(n) {
    this.dv.setUint32(14, n);
  }
  get ratio() {
    return this.dv.getFloat32(18);
  }
  set ratio(n) {
    this.dv.setFloat32(18, n);
  }
}
