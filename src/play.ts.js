const play = async (url) => {
  globalThis.ctx = globalThis.ctx || new AudioContext();
  const ctx = globalThis.ctx;
  const dv: DataView | void = await fetch(url)
    .then((resp) => resp.blob())
    .then((blob) => blob.arrayBuffer())
    .then((ab) => new DataView(ab))
    .catch(console.log);

  if (!dv) return;
  const audb = ctx.createBuffer(1, dv.buffer.byteLength / 4, 48000);
  const buffer = audb.getChannelData(0);
  for (let i = 0; i < audb.length; i++) {
    buffer[i] = dv.getFloat32(i * 4, true);
  }
  const abs = new AudioBufferSourceNode(ctx, { buffer: audb });
  abs.connect(ctx.destination);
  abs.start();
};
