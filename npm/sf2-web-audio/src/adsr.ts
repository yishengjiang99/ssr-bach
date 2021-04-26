import { SFZone, EnvParams } from "../node_modules/parse-sf2/dist/";
const attenuate2gain = (cent: number) => Math.pow(10, cent / -200);
const centtime2sec = (centtime: number) => Math.pow(2, centtime / 1200);
export type fn = () => void;
export function applyEnvelope(envelope: EnvParams, target: AudioParam, ctx: BaseAudioContext) {
	const normalizedSustain = 1 - envelope.sustain / 1000;
	const { delay, attack, hold, decay, release } = envelope.phases;
	const rates = [delay, attack, hold, decay, release].map((v) => centtime2sec(v));
	return {
		onAttack: () => {
			if (rates[1] < 0.0001) {
				target.setTargetAtTime(1, ctx.currentTime + 0.001, 0.001);
			} else {
				target.setTargetAtTime(0, ctx.currentTime + rates[0], 0.001);
			}
			target.linearRampToValueAtTime(1, ctx.currentTime + rates[1]);
			target.linearRampToValueAtTime(attenuate2gain(normalizedSustain), ctx.currentTime + rates[3]);
		},
		onRelease: () => {
			target.cancelAndHoldAtTime(ctx.currentTime);
			console.log(rates[4]);
			target.exponentialRampToValueAtTime(0.00001, ctx.currentTime + rates[4]);
		},
	};
}
