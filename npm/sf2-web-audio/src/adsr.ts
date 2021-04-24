import { SFZone, EnvParams, SampleData } from '../node_modules/parse-sf2/dist/';
const attenuate2gain = (cent: number) => Math.pow(10, cent / -200);
const centone2hz = (cent: number) => Math.pow(2, cent / 1200) * 8.176;
const centibel2regularamp = (centible: number) => Math.pow(10, centible / 200);
const centtime2sec = (centtime: number) => Math.pow(2, centtime / 1200);
export type fn = () => void;
export function applyEnvelope(
  envelope: EnvParams,
  target: AudioParam,
  ctx: BaseAudioContext,
  triggers: {
    onStarts: fn[];
    onReleases: fn[];
  }
) {
  const normalizedSustain = 1 - envelope.sustain / 1000;

  const { delay, attack, hold, decay, release } = envelope.phases;
  const rates = [delay, attack, hold, decay, release].map((v) =>
    centtime2sec(v)
  );
  triggers.onStarts.push(() => {
    //target.setValueCurveAtTime([0], 0, rates[0]);
    target.linearRampToValueAtTime(1, ctx.currentTime + rates[1]);
    target.linearRampToValueAtTime(
      attenuate2gain(normalizedSustain),
      ctx.currentTime + rates[3]
    );
  });
  triggers.onReleases.push(() => {
    target.cancelAndHoldAtTime(ctx.currentTime);
    console.log(rates[4]);
    target.exponentialRampToValueAtTime(0.00001, ctx.currentTime + rates[4]);
  });
}
