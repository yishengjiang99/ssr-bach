import assert from "assert";

let Module = require("../go.js");

export async function initGo(buffer: Buffer, n: number) {
  await new Promise((resolve) => {
    Module.addOnInit(resolve);
  });
  assert(buffer.byteLength / 2 >= n);
  assert(Module._malloc !== null);
  Module._init(buffer, n);
  return {
    /**
     * start voice
     * @param start
     * @param end
     * @param loopStart
     * @param loopEnd
     * @param length
     * @param channelId
     * @param ratio
     */
    noteOn: function (
      start: number,
      end: number,
      loopStart: number,
      loopEnd: number,
      length: number,
      channelId: number,
      ratio: number
    ) {
      Module._noteOn(start, end, loopStart, loopEnd, length, channelId, ratio);
    },
    /**
     * render chunk
     * @param size
     */
    render: function (size: number) {
      const ptr = Module._malloc(size * Float32Array.BYTES_PER_ELEMENT + 30);
      Module._render(ptr, size);
      const r = new Float32Array(Module.HEAPF32.buffer, ptr, size);
      Module._free(ptr);
      return r;
    },
  };
}
