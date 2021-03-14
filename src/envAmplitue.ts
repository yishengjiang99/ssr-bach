import { LUT } from './LUT';
import { TimeCent } from './sf.types';

export function* envAmplitue(envelopPhases, sustainCB, sr: number) {
  const [delay, attack, hold, decay, release] = envelopPhases;
  const steps = [delay, attack, hold, decay, release, 3 * release].map(
    (centisec) => LUT.absTC[~~centisec] * sr
  );

  let deltas: TimeCent[] = [
    0,
    960 / steps[1],
    0,

    sustainCB / steps[3],
    (960 - sustainCB) / 2 / steps[4],
    (960 - sustainCB) / 2 / steps[5],
  ];
  let amount;
  const amt = [960, 960, 0, sustainCB, 960 - sustainCB / 2];
  while (steps.length) {
    amount = amt.shift();
    while (steps[0] > 1) {
      amount += deltas[0];
      if (amount < 0) return 0;
      yield amount;
      steps[0]--;
    }
    steps.shift();
    deltas.shift();
  }
  return 0;
}
