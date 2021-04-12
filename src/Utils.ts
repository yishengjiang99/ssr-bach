export function range(x) {
  function* g(r) {
    let i = 0;
    while (i < r) yield i++;
    return 0;
  }
  return Array.from(g(x));
}
export function printpz(pz) {
  process.stdout.write(
    JSON.stringify(
      pz.map((z) => {
        const {
          keyRange,
          sample,
          velRange,
          sampleOffsets,
          vibrLFO,
          modEnv,
          sampleID,
          pitch,
        } = z;
        return {
          keyRange,
          velRange,
          sample,
          sampleOffsets,
          vibrLFO,
          modEnv,
          sampleID,
          pitch,
        };
      }),
      null,
      ' '
    )
  );
}

export function loop(n, cb) {
  while (n--) cb(n);
}
export function WAVheader(n: number, channel: number): Uint8Array {
  const buffer = new Uint8Array(44);
  const view = new DataView(buffer.buffer);
  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + n * 4, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 0x0003, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, 48000, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, 48000 * 8, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, channel * 8, true);
  /* bits per sample */
  view.setUint16(34, 32, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, n * 8, true);

  return buffer;
}
