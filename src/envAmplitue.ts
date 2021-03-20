export function envAmplitue(
  envelopPhases,
  sustainCB,
  sr: number,
  noteReleaseTime?: number // this is not required because we might not know when we call this functio
) {
  const [delay, attack, hold, decay, release] = envelopPhases;
  const stages = [delay, attack, hold, decay, release].map((centisec) =>
    centisec <= -12000 ? 1 : Math.pow(2, centisec / 1200) * sr
  );
  const amt = [960, 960, 0, 0, sustainCB];
  const deltas = [
    0 /*delay*/,
    -960 / stages[1] /*att*/,
    0 /*holding*/,
    sustainCB / stages[3],
  ];
  let releasing = false;
  function triggerRelease() {
    releasing = true;
  }
  function* genDBVals() {
    let amount = amt[0];

    for (let stag = 0; stag < 5; stag++) {
      while (stages[stag]-- > 0) {
        amount += deltas[stag];
        if (amount.isNaN) return 980;
        yield amount;
        if (stag < 4 && releasing === true) {
          stag = 4;
          /* prorated stage[4]steps via db loss acrued via decay stage*/
          stages[4] = (amount / 960) * stages[4];
          break;
        }
      }
    }
    return amount;
  }
  return {
    genDBVals,
    stages,
    deltas,
    triggerRelease,
  };
}
