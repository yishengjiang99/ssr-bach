import { SFZone } from "./Zone";
import { LUT } from "./LUT";
import { Envelope } from "./envelope";
import { Shdr } from "./sf.types";
LUT.init();

export function cent2hz(centiHz: number): number {
	return 8.176 * Math.pow(2, centiHz / 1200.0);
}
export function timecent2sec(timecent: number): number {
	return Math.pow(2, timecent / 1200.0);
}
export function centidb2gain(centibel: number): number {
	return Math.pow(10, centibel / 200);
}
export class LFO {
	sampleRate = 48000;
	amount = 0;
	delta: number;
	delay: number;
	cycles = 0;
	effects: ModEffects;
	constructor(delay: number, freq: centTone, effects: ModEffects, sampleRate = 48000) {
		this.sampleRate = sampleRate;
		this.delta = (4.0 * cent2hz(freq)) / sampleRate; //covering distance of 1/4 4 times per cycle..
		this.delay = delay < -12000 ? 0 : Math.pow(2, delay / 1200) * sampleRate;
		this.effects = effects;
	}
	static fromJSON(str: string): LFO {
		const obj = JSON.parse(str);
		return new LFO(obj.delay, obj.freq, obj.effects);
	}
	shift(steps = 1): number {
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
	get val(): number {
		return this.amount;
	}
	get volCB(): number {
		return (this.effects.volume * this.amount) / 10;
	}
	get pitchCent(): number {
		return this.effects.pitch * this.amount;
	}
}

export declare type centTone = number;
export declare type TimeCent = number;
export declare type centibel = number;
export declare type centime = number;
export declare type LFOParams = {
	delay: centime;
	freq: centTone;
	effects: ModEffects;
};
export declare type EnvPhases = {
	delay: centime;
	attack: centime;
	decay: centime;
	release: centime;
	hold: centime;
};
export declare type ModEffects = {
	volume?: number;
	filter?: number;
	pitch?: number;
};
export declare type KRate = number;
export interface ARate {
	static?: KRate;
	runtime: () => number;
}
export interface ModSource {
	val: Generator<number, number, null>;
	unit: centibel | centibel | centTone;
}
export interface VoiceState {
	gain: ARate;
	pitch: ARate;
	filter: ARate;
	filterQ: KRate;
	phase: ARate;
	pan: {
		left: KRate;
		right: KRate;
	};
}
export interface Ctx {
	sampleRate: number;
	chanVols: () => number[];
	masterVol: () => number;
}
export interface Note {
	key: number;
	velocity: number;
	channel: number;
}

export declare enum LOOPMODES {
	NO_LOOP = 0,
	CONTINUOUS_LOOP = 1,
	NO_LOOP_EQ = 2,
	LOOP_DURATION_PRESS = 3,
}
/**
ABSOLUTE CENTIBELS - An absolute measure of the attenuation of a signal, based on a reference of
zero being no attenuation. A centibel is a tenth of a decibel, or a ratio in signal amplitude of the two
hundredth root of 10, approximately 1.011579454.
RELATIVE CENTIBELS - A relative measure of the attenua
 */
export declare enum EnvelopeTarget {
	VOLUME = 0,
	PITCH = 1,
	FILTER = 2,
}
export const stagesEnum = {
	delay: 0,
	attack: 1,
	hold: 2,
	decay: 3,
	release: 4,
	done: 5,
};

export class Runtime {
	staticLevels: {
		gainCB: centibel;
		pitch: centTone;
		filter: centTone;
		pan: { left: number; right: number };
	};
	run: (steps: number) => { volume: number; pitch: number; filter: number };
	mods: {
		ampVol: { triggerRelease: (time?: number) => void; stages: number[] };
		modVol: Envelope;
		modLFO: LFO;
		vibrLFO: LFO;
	};
	length: number;
	sample: Shdr;
	iterator: number;
	zone: SFZone;
	sampleData?: Float32Array;

	constructor(zone: SFZone, note: { key: number; velocity: number; channel?: number }, sr = 48000) {
		this.zone = zone;
		this.staticLevels = {
			gainCB: zone.attenuate + LUT.velCB[note.velocity],

			pitch:
				note.key * 100 -
				zone.tuning -
				(zone.rootkey > -1 ? zone.rootkey : zone.sample.originalPitch) * 100 +
				Math.log2(zone.sample.sampleRate) * 1200 -
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
		this.run = (steps: number) => {
			modVol.shift(steps);
			ampVol.shift(steps);
			const arates = {
				volume: LUT.getAmp(this.staticLevels.gainCB + ampVol.ampCB),

				pitch: LUT.relPC[~~(this.staticLevels.pitch + modLFO.pitchCent + vibrLFO.pitchCent + 1200)],
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
