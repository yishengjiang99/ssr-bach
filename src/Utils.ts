import { PassThrough, Writable } from 'stream';

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
export function pt(cb, one: Writable = process.stdout) {
  const pt = new PassThrough();
  pt.on('data', cb);
  pt.pipe(one);
  return pt;
}
