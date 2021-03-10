import { AnalyzerView } from './analyserView';
let ctx, gainNode, av;
document.querySelectorAll("a").forEach((a) => (a.onclick = async (e) => {
    const url = a.href;
    e.preventDefault();
    if (!ctx)
        init();
    const dv = await fetch(url)
        .then((resp) => resp.blob())
        .then((blob) => blob.arrayBuffer())
        .then((ab) => new DataView(ab))
        .catch(console.log);
    if (!dv)
        return;
    const audb = ctx.createBuffer(1, dv.buffer.byteLength / 4, 48000);
    const buffer = audb.getChannelData(0);
    for (let i = 0; i < audb.length; i++) {
        buffer[i] = dv.getFloat32(i * 4, true);
    }
    const abs = new AudioBufferSourceNode(ctx, { buffer: audb });
    abs.connect(gainNode);
    abs.start();
}));
const init = () => {
    ctx = new AudioContext();
    gainNode = new GainNode(ctx);
    av = new AnalyserNode(ctx);
    gainNode.connect(av).connect(ctx.destination);
    const { canvas, start } = AnalyzerView(av);
    document.body.append(canvas);
    start();
    return { gainNode, ctx };
};