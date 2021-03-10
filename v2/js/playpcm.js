const worker = new Worker("js/fetchworker.js");
let proc, ctx;

async function start(midifile) {
  try {
    ctx = ctx || new AudioContext({ sampleRate: 48000, latencyHint: "playback" });

    if (ctx.state != "running") await ctx.resume();
    await ctx.audioWorklet.addModule("js/proc2.js");
    proc = new AudioWorkletNode(ctx, "playback-processor", {
      outputChannelCount: [2],
    });
    const analyzer = new AnalyserNode(ctx);
    proc.connect(analyzer).connect(ctx.destination);
    worker.postMessage({ port: proc.port, url: midifile }, [proc.port]);
    setTimeout(() => {
      AnalyzerView(analyzer).start();
    }, 500);
  } catch (e) {
    console.log("<font color='red'>" + e.message + "</font>");
  }
}

document.body.innerHTML +=
  "<canvas style='width:100vw;height:vh;background-color:black;z-index:10'></canvas>";
const tag = document.querySelector("audio");

var g_av_timers = [];
const AnalyzerView = function (analyser, params = {}) {
  const av = analyser;
  var canvas = document.querySelector("canvas"); //(elemId);
  const height = canvas.parentElement.clientHeight;
  const width = canvas.parentElement.clientWidth;
  const canvasCtx = canvas.getContext("2d");
  canvas.setAttribute("width", width + "");
  canvas.setAttribute("height", height + "");
  canvasCtx.fillStyle = "rbga(0,2,2,0.1)";
  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = "white";
  var dataArray = new Float32Array(av.fftSize);
  var convertY = (y) => (y * height) / 2 + height / 2;
  canvasCtx.fillRect(0, 0, width, height);
  canvasCtx.beginPath();
  canvasCtx.moveTo(0, convertY(0));
  var t = 0;
  canvasCtx.lineWidth = 1;
  var x = 0;
  var zoomScale = 1;

  function draw() {
    av.getFloatTimeDomainData(dataArray);
    var bufferLength = dataArray.length;
    canvasCtx.beginPath();
    var sum = 0;
    canvasCtx.moveTo(0, height / 2);
    sum = dataArray.reduce((accumulator, currentValue) => accumulator + currentValue);
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.fillStyle = "black";
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.strokeStyle = "white";
    canvasCtx.lineWidth = 1;
    let x = 0,
      iwidth = width / bufferLength; //strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100)
    for (let i = 0; i < bufferLength; i++) {
      canvasCtx.lineTo(x, convertY(dataArray[i]));
      x += iwidth;
    }
    canvasCtx.stroke();
    requestAnimationFrame(() => {
      requestAnimationFrame(draw);
    });
  }
  return {
    canvas: canvas,
    start: draw,
  };
};
