import { SF2File, SFZone } from "../node_modules/parse-sf2/dist/index.js";
import { applyEnvelope, fn } from "./adsr.js";

interface RT {
	iter: IterableIterator<number>;
	onRelease: () => void;
	onAttack: () => void;
}

export class SynthChannel {
	ctx: BaseAudioContext;
	preamp: GainNode;
	lpf: BiquadFilterNode;
	modLFO: OscillatorNode;
	ampVol: GainNode;
	program: number[] = [0, 0];
	sffile: SF2File;
	queue: RT[] = [];
	activeZones: SFZone[] = [];
	key: number = 0;
	velocity: number = 0;
	vibrLFO: OscillatorNode;

	constructor(ctx: BaseAudioContext, sffile: SF2File) {
		this.ctx = ctx;
		this.sffile = sffile;

		this.preamp = new GainNode(ctx, { gain: 1 });
		this.ampVol = new GainNode(ctx, { gain: 0 });
		this.lpf = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 9200, Q: 0 });
		this.modLFO = new OscillatorNode(ctx, { type: "triangle", frequency: 60 });
		this.vibrLFO = new OscillatorNode(ctx, {
			type: "triangle",
			frequency: 60,
		});
		this.modLFO.connect(this.lpf.detune);

		this.preamp.connect(ctx.destination);
	}
}
function passthrough(ctx: BaseAudioContext) {
	return ctx.createGain();
}
