const chunk = 128 * 4;

class Proc5 extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    var that = this;
    this.port.onmessage = async ({ data: { readable, msg } }) => {
      if (readable) {
        const reader = readable.getReader();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          while (value && value.length) {
            const b = value.slice(0, chunk);
            if (b.byteLength < 0) {
              let padded = new Uint8Array(chunk).fill(0);
              padded.set(b);
              that.buffer.push(padded);
            } else {
              that.buffer.push(b);
            }
          }
        }
      }
    };
    this.port.postMessage({ msg: "proc inited" });
  }
  process(_inputs, outputs, _parameters) {
    if (this.buffer.length == 0) return true;
    const ob = this.buffer.shift();
    const dv = new DataView(ob);
    for (let i = 0; i < 128; i++) {
      outputs[0][0][i] = dv.getFloat32(i * 4, true);
    }
    return true;
  }
}
registerProcessor("proc5", Proc5);
