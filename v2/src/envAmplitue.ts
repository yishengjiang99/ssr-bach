export function* envAmplitue(envelopPhases, sustain, sr: number) {
  const [delay, attack, hold, decay, release] = envelopPhases;
  const sustainGain = 8.176 * Math.pow(10, (-1 * sustain * 0.05) / 10);
  const steps = [delay, attack, hold, decay, release, 3 * release].map((centisec) =>
    centisec < -11000 ? 0 : Math.pow(2, centisec / 1200) / (1 / sr)
  );
  let deltas = [
    0,
    1 / steps[1],
    0,
    (1 - sustainGain) / steps[3],
    -sustainGain / 2 / steps[4],
    -sustainGain / 9 / sr,
  ];
  console.log(deltas, steps);
  let amount = 0;
  while (steps.length) {
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
