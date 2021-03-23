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
