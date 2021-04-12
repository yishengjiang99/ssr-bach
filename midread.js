import { readMidi } from './dist/index.js';

async function canvasR(url) {
  const g = document.querySelector('#mocha');

  const [start, stop, ff, next] = g.querySelectorAll('button');
  const console = g.querySelector('pre');
  const rxs = g.querySelectorAll('.rx');
  await new Promise((r) => (start.onclick = r));

  const r = readMidi(
    new Uint8Array(await (await fetch(url)).arrayBuffer()),
    null
  );
  const canvasCCs = r.tracks.map((t, ch) => getCanvas(ch, g));

  r.addListener((cmd, obj, time) => {
    if (time) rxs[0].innerHTML = time / r.ticksPerSecond;
    switch (cmd) {
      case 'header':
        const { division, ntracks, format } = obj;
        rxs[0].innerHTML = ``;
        break;
      case 'tempo':
        rxs[1].innerHTML = `${obj.tempo}`;
        break;
      case 'noteOn':
        if (!canvasCCs[obj.channel])
          canvasCCs[obj.channel] = getCanvas(obj.channel, g);
        canvasCCs[obj.channel].keyOn(obj);
        break;
      case 'noteOff':
        if (!canvasCCs[obj.channel])
          canvasCCs[obj.channel] = getCanvas(obj.channel, g);
        canvasCCs[obj.channel].keyOff(obj);
        break;
      case 'cc':
        break;
      default:
        break;
    }
    console.innerHTML = `${obj.channel}	${cmd}
            ${JSON.stringify(obj)}
            ${console.innerHTML.substring(0, 102)}`;
  });
  r.start();
  g.parentElement.style['margin-top'] = '10px';
  function getCanvas(channel, container) {
    const cells = 1 * 88;
    const gridw = 578 / 88;
    const gridh = 29;
    const canvas = document.createElement('canvas');
    const ctgx = canvas.getContext('2d');
    canvas.style.transform = `translate("440, ${channel * 30}")`;
    const height = 29;
    const width = 578;
    canvas.setAttribute('width', '578');
    canvas.setAttribute('height', '30');
    ctgx.lineWidth = 1;
    ctgx.strokeStyle = 'grey';
    ctgx.clearRect(0, 0, width, height);
    ctgx.fillRect(0, 0, width, height);
    container.append(canvas);
    return {
      keyOn: (obj) => {
        ctgx.clearRect(obj.note * gridw, 0, gridw, gridh);
        ctgx.fillStyle = 'red';
        ctgx.rect(obj.note * gridw, 0, gridw, gridh);
        ctgx.fill();
      },
      keyOff: (obj) => {
        ctgx.clearRect(obj.note * gridw, 0, gridw, gridh);
        ctgx.fillStyle = 'black';
        ctgx.rect(obj.note * gridw, 0, gridw, gridh);
        ctgx.fill();
      },
      setText: (text) => {
        ctgx.fillStyle = 'black';
        ctgx.clearRect(0, 0, 55, 20);
        ctgx.fillRect(0, 0, 55, 20);
        ctgx.strokeStyle = 'yellow';
        ctgx.strokeText(text, 10, 20, 55); //`time: ${time / midid.ticksPerSecond}`, 10, 20, 55);
      },
    };
  }
}
