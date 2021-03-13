const worker = new Worker('js/fetchworker.js');
let proc, ctx, analyzer;
async function initCtx() {
  ctx = new AudioContext({ sampleRate: 48000, latencyHint: 'playback' });
}
async function initProc(ctx) {
  await ctx.audioWorklet.addModule('js/build/proc3.js');
  proc = new AudioWorkletNode(ctx, 'playback-processor', {
    outputChannelCount: [2],
  });
  analyzer = analyzer || new AnalyserNode(ctx);

  proc.connect(analyzer).connect(ctx.destination);
}
async function start(midifile) {
  try {
    if (!ctx) await initCtx();
    if (proc) proc = null;

    if (ctx.state != 'running') await ctx.resume();
    if (!proc) {
      await initProc(ctx);
    }
    worker.postMessage({ url: midifile, port: proc.port }, [proc.port]);
    setTimeout(() => {
      const { start } = AnalyzerView(analyzer);
      start();
    }, 500);
  } catch (e) {
    console.log("<font color='red'>" + e.message + '</font>');
    throw e;
  }
}

document.body.innerHTML +=
  "<canvas style='opacity:0;position:absolute;width:100vw;height:100vh;background-color:black;z-index:-1'></canvas>";

var g_av_timers = [];
const AnalyzerView = function (analyser, params = {}) {
  const av = analyser;
  var canvas = document.querySelector('canvas'); //(elemId);
  const height = canvas.parentElement.clientHeight;
  const width = canvas.parentElement.clientWidth;
  const canvasCtx = canvas.getContext('2d');
  canvas.setAttribute('width', width + '');
  canvas.setAttribute('height', height + '');
  canvasCtx.fillStyle = 'rbga(0,2,2,0.1)';
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
document.body.onload = () => {
  document.querySelectorAll('a.pcm').forEach(function (a) {
    a.addEventListener('click', () => {});
    a.addEventListener('mousedown', (e) => {
      e.preventDefault();
      let t0 = performance.now();
      const onclick: EventListenerOrEventListenerObject = (e) => {
        const vel = performance.now()[0] - t0[0];
        const rvel = vel < 0 ? 1 - vel : vel;
        start(e.target.href);
      };
      a.addEventListener('mouseup', onclick, { once: true });
      return false;
    });
  });
};
document
  .querySelectorAll('a.nav')
  .forEach((a) => a.addEventListener('click', onNavClick));

function onNavClick(e) {
  e.preventDefault();
  fetch(e.target.href)
    .then((res) => res.text())
    .then((html) => {
      document.querySelector('main').innerHTML = html;
    })
    .catch((e) => console.error);
}

window.onload = (e) => {
  document.querySelectorAll('a.pcm').forEach((a) => {
    // a.removeEventListener('click');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      start(e.target.href);
      return true;
    });
  });
};
