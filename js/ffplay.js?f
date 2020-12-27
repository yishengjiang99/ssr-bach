export class FF32Play extends EventTarget {
  constructor() {
    super();
    this.worker = new Worker(workerURL);
    this.status = {
      buffered: 0,
      lossPercent: 0,
      downloaded: 0,
      rms: 0,
      ready: true,
      msg: "",
    };
    this.statusNode = document.createElement("pre");
    this.statusNode.id = "statusnode";
    document.body.append(this.statusNode);
    this.worker.onmessage = (e) => {
      if (e.data === "cts") return;
      this.statusNode.innerHTML = `       inmemory: ${e.data.buffered}
      loss: ${e.data.lossPercent}
      total : ${e.data.downloaded}
      rms:      ${e.data.rms}
      ready:    ${e.data.ready}  
      msg:      ${e.data.msg}`;
    };
  }
  get started() {
    return this.ctx === null || this.ctx.state === "suspended";
  }
  async setup() {
    try {
      this.ctx = new AudioContext({
        sampleRate: 48000,
        latencyHint: "playback",
      });
      const analyzer = new AnalyserNode(this.ctx);
      const av = AnalyzerView(analyzer);
      document.body.append(av.canvas);
      await this.ctx.audioWorklet.addModule(procURL);
      this.worklet = new AudioWorkletNode(this.ctx, "playback-processor", {
        outputChannelCount: [2],
      });
      this.worklet.connect(analyzer).connect(this.ctx.destination);
      this.worker.postMessage({ port: this.worklet.port }, [this.worklet.port]);
      av.start();
    } catch (e) {
      throw e;
    }
  }
  async queue(url) {
    if (this.worklet) {
      console.log("posting url", url);
      this.worker.postMessage({ url });
    } else {
      this.setup()
        .then(() => {
          console.log("posting url", url);
          this.worker.postMessage({ url });
        })
        .catch((e) => {
          alert(e.message);
        });
    }
  }
  next() {
    this.worker.postMessage({ cmd: "ff" });
  }
}
var g_av_timers = [];
export const AnalyzerView = function (analyser, params) {
  const { width, height } = {
    ...(params || {}),
    ...{
      width: 1024,
      height: 720,
    },
  };
  const av = analyser;
  const HEIGHT = height;
  const WIDTH = width;
  var canvas = document.createElement("canvas"); //(elemId);
  const canvasCtx = canvas.getContext("2d");
  canvas.setAttribute("width", width + "");
  canvas.setAttribute("height", height + "");
  canvasCtx.fillStyle = "rbga(0,2,2,0.1)";
  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = "white";
  var dataArray = new Float32Array(av.fftSize);
  var convertY = (y) => (y * height) / 2 + height / 2;
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  canvasCtx.beginPath();
  canvasCtx.moveTo(0, convertY(0));
  var t = 0;
  canvasCtx.lineWidth = 1;
  var x = 0;
  var zoomScale = 1;
  canvas.onwheel = function (e) {
    e.preventDefault();
    if (e.deltaY < 0) zoomScale -= 0.05;
    else zoomScale += 0.05;
  };
  function draw() {
    av.getFloatTimeDomainData(dataArray);
    var bufferLength = dataArray.length;
    canvasCtx.beginPath();
    var sum = 0;
    canvasCtx.moveTo(0, height / 2);
    sum = dataArray.reduce(
      (accumulator, currentValue) => accumulator + currentValue
    );
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.strokeStyle = "white";
    canvasCtx.lineWidth = 1;
    let x = 0,
      iwidth = width / bufferLength;
    canvasCtx.strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100);
    for (let i = 0; i < bufferLength; i++) {
      canvasCtx.lineTo(x, convertY(dataArray[i]));
      x += iwidth;
    }
    canvasCtx.stroke();
    requestAnimationFrame(draw);
  }
  return {
    canvas: canvas,
    start: draw,
  };
};
//# sourceMappingURL=FFPlay.js.map
const workerBlob = `const ctx = self;
const queue = [];
let procPort;
ctx.onmessage = ({ data: { port, url } }) => {
    if (port) {
        port.onmessage = (e) => {
            ctx.postMessage(e.data);
        };
        procPort = port;
    }
    if (url && procPort) {
        let offset = 0;
        queue.push({ from: 0 * 1024 * 1024, to: 2 * 1024 * 1024, url });
        offset = offset + 2 * 1024 * 1024;
        async function loop() {
            try {
                if (queue.length == 0)
                    return;
                const { url, from, to } = queue.shift();
                const resp = await fetch(url, {
                    headers: { "if-range": "bytes="+from+"-"+to },
                });
                // @ts-ignore
                procPort.postMessage({ readable: resp.body }, [resp.body]);
                // await new Promise<void>((resolve) => {
                //   procPort.onmessage = (e) => {
                //     e.data === "cts" ? resolve() : ctx.postMessage(e.data);
                //   };
                // });
                procPort.onmessage = (e) => {
                    ctx.postMessage(e.data);
                };
                if (resp.status !== 206)
                    return;
                else {
                    queue.push({ url, from: offset, to: offset + 1024 * 1024 });
                    offset = offset + 1 * 1024 * 1024;
                }
                if (queue.length)
                    loop();
            }
            catch (e) {
                console.log(e);
            }
        }
        setInterval(loop, 1222);
        // @ts-ignore
        //  procPort.postMessage({ readable }, [readable]);
    }
};
//# sourceMappingURL=worker.js.map`;
const workerURL = URL.createObjectURL(
  new Blob([workerBlob], { type: "application/javascript" })
);

const procblob = `const frame = 36;
const chunk = 1024;
/* @ts-ignore */
class PlaybackProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffers = [];
        this.readqueue = [];
        this.started = false;
        this.port.postMessage({ msg: "initialized" });
        this.port.onmessage = ({ data, }) => {
            this.readqueue.push(data.readable);
            if (!this.reading)
                readloop();
        };
        let that = this;
        async function readloop() {
            that.reading = true;
            while (that.readqueue.length > 0) {
                const reader = that.readqueue.shift().getReader();
                await reader
                    .read()
                    .then(function process(result) {
                    if (result.done)
                        return;
                    let value = result.value;
                    while (value.length >= chunk) {
                        const b = value.slice(0, chunk);
                        that.buffers.push(b);
                        value = value.slice(chunk);
                        that.total++;
                        if (that.total % 100 == 1)
                            that.report();
                        if (that.started === false && that.buffers.length > 10) {
                            that.started = true;
                        }
                    }
                    that.leftPartialFrame = value;
                    reader.read().then(process);
                })
                    .then(() => {
                    that.port.postMessage("cts");
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
            rms: this.readqueue.length,
            downloaded: this.total,
            buffered: this.buffers.length,
            lossPercent: ((this.loss / this.total) * 100).toFixed(2),
        });
    }
    process(inputs, outputs, parameters) {
        if (this.started === false) {
            this.loss++;
            //  this.port.postMessage("cts");
            return true;
        }
        if (this.buffers.length === 0) {
            this.loss++;
            this.report();
            this.port.postMessage("cts");
            return true;
        }
        this.total++;
        const ob = this.buffers.shift();
        const fl = new Float32Array(ob.buffer);
        let sum = 0;
        for (let i = 0; i < 128; i++) {
            for (let ch = 0; ch < 2; ch++) {
                outputs[0][ch][i] = fl[i * 2 + ch];
                sum += fl[i * 2 + ch] * fl[i * 2 + ch];
            }
        }
        this.rms = Math.sqrt(sum / 256);
        return true;
    }
}
// @ts-ignore
registerProcessor("playback-processor", PlaybackProcessor);
`;
const procURL = URL.createObjectURL(
  new Blob([procblob], { type: "application/javascript" })
);
