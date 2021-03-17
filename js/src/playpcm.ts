// let proc, ctx, analyzer;
let ctx, gainNode, av;

async function initCtx() {
  ctx = new AudioContext({ sampleRate: 48000, latencyHint: 'playback' });
  await ctx.audioWorklet.addModule('js/proc2.js');
}
const init = () => {
  ctx = new AudioContext();
  gainNode = new GainNode(ctx);
  av = new AnalyserNode(ctx);
  gainNode.connect(av).connect(ctx.destination);
  const { start } = AnalyzerView(av);
  start();
  return { gainNode, ctx };
};
async function start(midifile) {
  try {
    if (!ctx) init();
    const dv = await fetch(midifile)
      .then((resp) => resp.blob())
      .then((blob) => blob.arrayBuffer())
      .then((ab) => new DataView(ab))
      .catch(console.log);
    if (!dv) return;
    const audb = ctx.createBuffer(2, dv.buffer.byteLength / 8, 48000);
    const buffers = [audb.getChannelData(0), audb.getChannelData(1)];

    for (let i = 0; i < audb.length; i++) {
      buffers[0][i] = dv.getFloat32(i * 8, true);
      buffers[1][i] = dv.getFloat32(i * 8 + 4, true);
    }
    const abs = new AudioBufferSourceNode(ctx, { buffer: audb });
    abs.connect(gainNode);
    abs.start();
  } catch (e) {
    console.log("<font color='red'>" + e.message + '</font>');
    throw e;
  }
}

var g_av_timers = [];
const AnalyzerView = function (analyser, params = {}) {
  const av = analyser;
  var canvas = document.querySelector('canvas'); //(elemId);
  const height = canvas.parentElement.clientHeight;
  const width = canvas.parentElement.clientWidth;
  const canvasCtx = canvas.getContext('2d');
  canvas.setAttribute('width', width + '');
  canvas.setAttribute('height', height + '');
  canvasCtx.fillStyle = 'black';
  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = 'white';
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
    sum = dataArray.reduce(
      (accumulator, currentValue) => accumulator + currentValue / bufferLength
    );
    let rms = sum / 9;
    if (sum == 0) {
      setTimeout(draw, 100);
      return;
    }

    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.fillStyle = `rbga(10,10,10, ${rms * 100})`;
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.strokeStyle = 'white';
    canvasCtx.lineWidth = 1;
    let x = 0,
      iwidth = width / bufferLength; //strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100)
    for (let i = 0; i < bufferLength; i++) {
      canvasCtx.lineTo(x, convertY(dataArray[i]));
      x += iwidth;
    }
    canvasCtx.stroke();
    requestAnimationFrame(draw);
  }
  return {
    canvas: canvas,
    start: () => requestAnimationFrame(draw),
  };
};
// };

window.onmousedown = (e) => {
  if (e.target.classList.contains('pcm')) {
    e.preventDefault();
    e.stopPropagation();

    start(e.target.href.split('#')[1]);
    return false;
  }
};
function initAnalyser() {
  if (!av) {
    av = new AnalyserNode(ctx);
    av.connect(ctx.destination);
  }
}
