Module.addOnInit(async function () {
  Module._initWithPreload();
  postMessage("init");
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
