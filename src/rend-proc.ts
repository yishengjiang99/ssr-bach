/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const dbfs = 960;
class LUT {
	static absTC: any;
	static cent2amp: any[];
	static velCB: any[];
	static relPC: any;
	static frqST: any;
	static midiCB: any;
	static init() {
		if (LUT.absTC.length > 0) return;
		for (let n = 0; n < 20000; n += 1) LUT.absTC[n] = Math.pow(2.0, (n - 12000.0) / 1200.0);
		LUT.cent2amp = [];
		for (let i = 0; i <= dbfs; i++) {
			LUT.cent2amp[i] = Math.pow(10, i / -200.0);
		}
		LUT.velCB = new Array(128);
		LUT.velCB[0] = 0.0;
		LUT.velCB[127] = 1.0;
		for (let i = 1; i < 127; i++) {
			LUT.velCB[i] = (-200.0 / dbfs) * Math.log((i * i) / (127 * 127));
		}
		for (let n = 0; n < 2400; n++) {
			LUT.relPC[n] = Math.pow(2.0, (n - 1200.0) / 1200.0);
		}
		for (let n = 0; n < 128; n++) {
			LUT.frqST[n] = 440 * Math.pow(2, (n - 69) / 12.0);
		}
		LUT.midiCB[0] = 0;
		LUT.midiCB[127] = 1.0;
		for (let n = 1; n < 128; n++) {
			LUT.midiCB[n] = -200.0 * Math.log(n / 127);
		}
	}
	static centtime2sec(ct) {
		if (ct < -12000) return 0.001;
		if (ct > 8000) return 30;
		ct = ct + 12000;
		return LUT.absTC[~~ct];
	}
	static midi2cb(midi) {
		if (midi > 127 || midi < 0) throw "out of range ";
		return LUT.midiCB[~~midi];
	}
	static getAmp(cb) {
		cb = ~~cb;
		if (cb <= 0) return 1;
		if (cb >= dbfs) return 0;
		return LUT.cent2amp[cb];
	}
}
LUT.relPC = [];
LUT.frqST = [];
LUT.midiCB = [];
LUT.velCB = [];
LUT.cent2amp = [];
LUT.absTC = [];
LUT.init();
function cent2hz(centiHz) {
	return 8.176 * Math.pow(2, centiHz / 1200.0);
}
function timecent2sec(timecent) {
	return Math.pow(2, timecent / 1200.0);
}
function centidb2gain(centibel) {
	return Math.pow(10, centibel / 200);
}
class LFO {
	sampleRate: number;
	amount: number;
	cycles: number;
	delta: number;
	delay: number;
	effects: any;
	constructor(delay, freq, effects, sampleRate = 48000) {
		this.sampleRate = 48000;
		this.amount = 0;
		this.cycles = 0;
		this.sampleRate = sampleRate;
		this.delta = (4.0 * cent2hz(freq)) / sampleRate; //covering distance of 1/4 4 times per cycle..
		this.delay = delay < -12000 ? 0 : Math.pow(2, delay / 1200) * sampleRate;
		this.effects = effects;
	}
	static fromJSON(str) {
		const obj = JSON.parse(str);
		return new LFO(obj.delay, obj.freq, obj.effects);
	}
	shift(steps = 1) {
		while (steps-- > 0) {
			if (this.delay-- > 0) continue;
			this.amount += this.delta;
			if (this.amount >= 1 || this.amount <= -1) {
				this.delta = -1 * this.delta;
				this.cycles++;
			}
		}
		return this.amount;
	}
	get val() {
		return this.amount;
	}
	get volCB() {
		return (this.effects.volume * this.amount) / 10;
	}
	get pitchCent() {
		return this.effects.pitch * this.amount;
	}
}
const stagesEnum = {
	delay: 0,
	attack: 1,
	hold: 2,
	decay: 3,
	release: 4,
	done: 5,
};
class Envelope {
	state: { stage: number; stageStep: number };
	stages: any[];
	keyOff: boolean;
	releaseTimeout: number;
	amts: number[];
	deltas: number[];
	egval: number;
	effects: any;
	constructor(phases, sustainCB, sampleRate = 48000) {
		this.state = {
			stage: 0,
			stageStep: 0,
		};
		this.stages = [];
		this.keyOff = false;
		this.releaseTimeout = 99999;
		if (phases[4]) {
			const [delay, attack, hold, decay, release] = phases;
			return new Envelope({ delay, attack, hold, decay, release }, sustainCB, sampleRate);
		}
		const { delay, attack, hold, decay, release } = phases;
		this.stages = [delay, attack, hold, decay, release]
			.map((centime) => LUT.centtime2sec(centime) * sampleRate)
			.map((t) => Math.max(1, t));
		const normalizedSustain = 1 - sustainCB / 1000;
		this.amts = [0, 0, 1, 1, normalizedSustain, 0];
		this.deltas = [
			0,
			1 / this.stages[1],
			0,
			normalizedSustain / this.stages[3],
			-1 / this.stages[4],
			0,
		];
		this.egval = 0;
	}
	get done() {
		return this.egval < -10 || this.state.stage == 5;
	}
	get val() {
		return this.egval;
	}
	shift(steps) {
		this.releaseTimeout -= steps;
		if (this.releaseTimeout <= 128) {
			this.triggerRelease();
		}
		const { stage, stageStep } = this.state;
		if (stage === 5) return 0;
		const stepsremining = this.stages[stage] - stageStep - steps;
		if (stepsremining < 0) {
			this.state.stage++;
			this.state.stageStep = -1 * stepsremining;
			this.egval =
				this.amts[this.state.stage] + this.deltas[this.state.stage] * this.state.stageStep;
		} else {
			this.state.stageStep += steps;
			this.egval += steps * this.deltas[this.state.stage];
		}
	}
	get ampCB() {
		return (1 - this.egval) * dbfs;
	}
	get gain() {
		return Math.pow(10, this.ampCB / -200.0);
	}
	get modCenTune() {
		return this.effects.pitch * this.egval;
	}
	get stage() {
		return this.state.stage;
	}
	*iterator() {
		if (this.done) return 0;
		else yield this.val;
	}
	triggerRelease(timeout = 0) {
		if (timeout && timeout > 0) this.releaseTimeout = timeout;
		else if (this.state.stage < stagesEnum.release) {
			this.state.stage = stagesEnum.release;
			this.state.stageStep = 0;
			this.stages[stagesEnum.release] = this.egval / this.deltas[stagesEnum.release];
		}
	}
}
class Runtime {
	zone: any;
	staticLevels: { gainCB: any; pitch: number; filter: any; pan: { left: number; right: number } };
	iterator: any;
	length: any;
	sample: any;
	run: (steps: any) => { volume: any; pitch: number; filter: number };
	mods: { ampVol: Envelope; modVol: Envelope; modLFO: LFO; vibrLFO: LFO };
	constructor(zone, note, sr = 48000) {
		this.zone = zone;
		this.staticLevels = {
			gainCB: zone.attenuate + LUT.velCB[note.velocity],
			pitch:
				/*	float sampleTone = rt * 100.0f + z->CoarseTune * 100.0f + (float)z->FineTune;
	float octaveDivv = ((float)midi * 100 - sampleTone) / 1200.0f;
	v->ratio = 1.0f * pow(2.0f, octaveDivv) * sh->sampleRate / 48000;*/

				note.key * 100 -
				zone.tuning -
				(zone.rootkey > -1 ? zone.rootkey : zone.sample.originalPitch) * 100 -
				Math.log2(zone.sample.sampleRate) * 1200 +
				Math.log2(sr) * 1200,
			filter: zone.lpf.cutoff,
			pan: {
				left: 0.5 - zone.pan / 1000,
				right: 0.5 + zone.pan / 1000,
			},
		};

		zone.modEnv.phases.attack = (zone.modEnv.phases.attack * (145 - note.velocity)) / 144.0;
		this.iterator = zone.sample.start;
		const ampVol = new Envelope(zone.volEnv.phases, zone.volEnv.sustain);
		const modVol = new Envelope(zone.modEnv.phases, zone.modEnv.sustain);
		this.length = ampVol.stages[0] + ampVol.stages[1] + ampVol.stages[2] + ampVol.stages[3];
		this.sample = zone.sample;
		modVol.effects = zone.modEnv.effects;
		const modLFO = new LFO(zone.modLFO.delay, zone.modLFO.freq, zone.modLFO.effects);
		const vibrLFO = new LFO(zone.modLFO.delay, zone.modLFO.freq, zone.modLFO.effects);
		this.run = (steps) => {
			modVol.shift(steps);
			ampVol.shift(steps);
			modLFO.shift(steps);
			vibrLFO.shift(steps);
			const arates = {
				volume: LUT.getAmp(
					this.staticLevels.gainCB + ampVol.ampCB + (modVol.egval * modVol.effects.volume) / 10
				),
				pitch: Math.pow(2, (this.staticLevels.pitch - vibrLFO.pitchCent) / 1200),
				filter: 1,
			};
			return arates;
		};
		this.mods = { ampVol, modVol, modLFO, vibrLFO };
	}
	get smpl() {
		return this.sample;
	}
}

export { Envelope, LFO, LUT, Runtime, cent2hz, centidb2gain, dbfs, stagesEnum, timecent2sec };

const sampleRate = 48000;
//@ts-ignore
class RenderProcessor extends AudioWorkletProcessor {
	staging: any[];
	production: any[];
	port: any;
	samples: Float32Array;
	startTime: any;
	constructor(options) {
		super();
		this.staging = [];
		this.production = new Array(16);
		this.port.onmessage = (e) => {
			const { samples, zone, note } = e.data;
			if (samples) {
				this.samples = new Float32Array(samples);
				this.startTime = globalThis.currentTime;
				this.port.postMessage({ ready: 1 });
			}
			if (zone && note) {
				const sampleData = ({ start, end }) => this.samples.subarray(start, end);
				const { start, channelId } = note;
				const rt = new Runtime(zone, {
					key: note.midi,
					velocity: note.velocity,
					channel: channelId,
				});
				this.staging.push({
					channelId,
					note,
					rt,
					sampleData: this.samples.subarray(zone.sample.start, zone.sample.end),
					shift: 0.0,
					get startFrame() {
						if (this.startTime == null) return false;
						return (start - this.startTime) / sampleRate;
					},
				});
			}
		};
	}
	process(inputs, outputs, parameters) {
		while (this.staging[0]?.startFrame < globalThis.currentFrame + 128) {
			const v = this.staging.shift();
			v.preroll = ~~(v.startFrame - globalThis.currentFrame);
			this.production[v.channelId] = v;
		}
		for (let vid = 0; vid < 17; vid++) {
			if (!this.production[vid]) continue;
			const v = this.production[vid];
			let { preroll } = v;
			//    const rootkey =v.rt.zone.rootKey >-1 ?v.rt.zone.rootKey :v.rt.zone.sample.originalPitch;
			const { pitch, volume } = v.rt.run(128);
			const pan = v.rt.staticLevels.pan;
			let iterator = v.rt.iterator;
			const looper = v.rt.sample.end - v.rt.sample.start;
			for (let offset = 0; offset < 128; offset++) {
				let newval;
				if (preroll-- > 0) {
					newval = 0;
					continue;
				} else {
					newval = this.samples[iterator];
				}
				newval = newval * volume;
				outputs[0][0][offset] += newval * pan.left;
				outputs[0][1][offset] += newval * pan.right;
				v.shift = v.shift + pitch;
				while (v.shift >= 1) {
					iterator++;
					v.shift--;
				}
				if (iterator >= v.rt.sample.endLoop) {
					iterator = iterator - looper + 1;
				}
			}
			v.rt.iterator = iterator;
		}
		return true;
	}
}
// @ts-ignore
registerProcessor("rend-proc", RenderProcessor);
