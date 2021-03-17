import { LUT } from './LUT';
import { TimeCent } from './sf.types';

export function* envAmplitue(
  envelopPhases,
  sustainCB,
  sr: number,
  noteVelocity: number = 120
) {
  //	e->samplesUntilNextSegment = (int)(e->parameters.attack * ((145 - e->midiVelocity) / 144.0f) * outSampleRate);

  const [delay, attack, hold, decay, release] = envelopPhases;
  const attackVelModulated = attack * (145 - noteVelocity / 144); //1440 - attack / noteVelocity;
  const steps = [
    delay,
    attackVelModulated,
    hold,
    decay,
    release,
    3 * release,
  ].map((centisec) => {
    return LUT.absTC[~~centisec + 12000] * sr;
  });

  let deltas: TimeCent[] = [
    0,
    -960 / steps[1],
    0,
    sustainCB / steps[3],
    (960 - sustainCB) / 2 / steps[4],
    (960 - sustainCB) / 9 / steps[5],
  ];
  let amount;
  const amt = [960, 960, 0, sustainCB, 960 - sustainCB / 2];
  while (steps.length) {
    amount = amt.shift();
    while (steps[0] > 1) {
      amount += deltas[0];
      if (amount > 1100) return 0;
      yield amount;
      steps[0]--;
    }
    steps.shift();
    deltas.shift();
  }
  return 0;
}
