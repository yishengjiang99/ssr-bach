const chunk = 128 * 4 * 2;

/* @ts-ignore */
class PlaybackProcessor extends AudioWorkletProcessor {
  buffers: any[];
  readqueue: any[];
  started: boolean;
  port: any;
  reading: any;
  total: any;
  leftPartialFrame: any;
  loss: number;
  rms: number;
  constructor() {
    super();
    this.buffers = [];
    this.readqueue = [];
    this.started = false;
    this.port.postMessage({ msg: "initialized" });
    this.port.onmessage = ({ data }) => {
      this.readqueue.push(data.readable);
      if (!this.reading) readloop();
    };
    let that = this;
    async function readloop() {
      that.reading = true;
      while (that.readqueue.length > 0) {
        const reader = that.readqueue.shift().getReader();
        await reader
          .read()
          .then(function process(result) {
            if (result.done) return;
            let value = result.value;
            while (value.length >= chunk) {
              const b = value.slice(0, chunk);
              that.buffers.push(b);
              value = value.slice(chunk);
              that.total++;

              if (that.started === false && that.buffers.length > 54) {
                that.started = true;
              }
            }
            that.leftPartialFrame = value;
            if (that.total % 134 == 1) that.report();
            reader.read().then(process);
          })
          .catch((e) => {
            that.port.postMessage({ msg: e.message });
          });
      }
      that.reading = false; //.started = false;
      return;
    }
    this.reading = false;
    this.loss = 0;
    this.total = 0;
    this.rms = 0;
    this.leftPartialFrame = null;
  }
  report() {
    this.port.postMessage({
      stats: {
        rms: this.rms.toFixed(3),
        downloaded: (this.total * 128 * 4) / 1024,
        buffered: (this.buffers.length * 128 * 4) / 1024,
        lossPercent: ((this.loss / this.total) * 100).toFixed(2),
      },
    });
  }
  process(inputs, outputs, parameters) {
    if (this.started === false) {
      return true;
    }
    if (this.buffers.length === 0) {
      this.loss++;
      this.report();
      return true;
    }
    this.total++;
    const ob = this.buffers.shift();
    const fl = new Float32Array(ob.buffer);
    let sum = 0;
    for (let i = 0; i < 128; i++) {
      const chl = outputs[0].length;
      for (let ch = 0; ch < chl; ch++) {
        outputs[0][ch][i] = fl[i * chl];
        sum += fl[i * chl + ch] * fl[i * chl + ch];
      }
    }
    this.rms = Math.sqrt(sum / 256);
    return true;
  }
}
// @ts-ignore
registerProcessor("playback-processor", PlaybackProcessor);
