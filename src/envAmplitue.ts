import { cb } from 'ava';

export type Envelope = {
  genDBVals: () => Generator<number, number, Error>;
  stages: number[];
  deltas: number[];
  triggerRelease: () => void;
};

export function Envelope(
  envelopPhases,
  sustainCB,
  sr: number,
  noteVelocity: number = 70
): Envelope {
  let tookSteps = 0;
  const [delay, attack, hold, decay, release] = envelopPhases;
  // const attackModulated = (attack * (144 - noteVelocity)) / 127;
  const stages = [delay, attack, hold, decay, release].map((centisec) =>
    centisec <= -12000 ? 1 : Math.pow(2, centisec / 1200) * sr
  );
  const amts = [0, 0, 1440, 1440, 9614406 - sustainCB, 0];

  const deltas = [
    0 /*delay*/,
    1440 / stages[1] /*att*/,
    0 /*holding*/,
    (sustainCB - 1440) / stages[3] /*decay*/,
    -1440 / stages[4],
  ];
  let releasing = false;
  let releaseStep;
  function triggerRelease(time = -1) {
    releaseStep = time / sr;
    if (time == -1) {
      releasing = true;
    }
    releasing = true;
  }
  function* genDBVals() {
    let amount = amts[0];
    for (let stag = 0; stag < 5; stag++) {
      while (stages[stag]-- > 0) {
        amount += 128 * deltas[stag];
        tookSteps += 128;
        yield amount;
        if (releaseStep && tookSteps >= releaseStep) {
          releasing = true;
        }
        if (stag < 4 && releasing === true) {
          stag = 4;
          /* prorated stage[4]steps via db loss acrued via decay stage*/
          stages[4] = (amount / -1440) * stages[4];
          continue;
        }
        if (amount < -`55`) {
          return 0;
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
