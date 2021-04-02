const debug = document.createElement('pre');
document.body.appendChild(debug);
// let proc, ctx, analyzer;
let ctx, proc, av;
const worker = new Worker('js/build/fetchworker.js');
async function initCtx(pcmUrl) {
  ctx = new AudioContext({ sampleRate: 48000, latencyHint: 'playback' });
  await ctx.audioWorklet.addModule('js/build/proc3.js');

  proc = new AudioWorkletNode(ctx, 'playback-processor', {
    outputChannelCount: [2],
  });
  await ctx.suspend();

  worker.postMessage({ url: pcmUrl, port: proc.port }, [proc.port]);
  await new Promise((resolve) => {
    worker.addEventListener(
      'message',
      ({ data: { ready } }) => {
        resolve(1);
      },
      { once: true }
    );
  });
  worker.onmessage = ({ data }) => {
    debug.innerHTML += JSON.stringify(data);
  };
  proc.connect(ctx.destination);
  proc.resume();
}

function start(pcmUrl) {
  try {
    if (!ctx || !proc) initCtx(pcmUrl);
    else {
      worker.postMessage({ url: pcmUrl });
    }
  } catch (e) {
    console.log("<font color='red'>" + e.message + '</font>');
    throw e;
  }
}
window.onclick = (e) => {
  if (e.target.classList.contains('pcm')) {
    e.preventDefault();
    e.stopPropagation();
    // const metaurl = e.target.getAttribute('metasrc');
    // fetch(metaurl)
    //   .then((res) => res.text())
    //   .then((r) => (document.querySelector('ff2').innerHTML = r));
    start(window.location.origin + '/' + e.target.getAttribute('href'));

    return false;
  }
};
