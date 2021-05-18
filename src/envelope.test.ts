import { Envelope } from "./envAmplitue";
import test from "ava";
import { SF2File } from "./sffile";
import { dbfs } from "./runtime.types";
test("baisc", (t) => {
	const g = new Envelope([-12000, -12000, -12000, -4000, -333], 333, 48000);
	t.is(g.stages.length, 5);
	t.assert(g.deltas.every((d) => d != Infinity));

	//console.log(g.deltas);
});
test("full attenuate during decay", (t) => {
	const g = new Envelope([-12000, -12000, -12000, -4000, -333], 1000, 47);
	t.is(g.stages.length, 5);
	t.assert(g.deltas[1] > 0);
	t.assert(g.deltas.every((d) => d != Infinity));
	t.assert(g.deltas.every((d) => d != Infinity));
	Array.from(g.iterator()).map((v: number) => {
		t.assert(v != NaN);
	});
});
test("piano", (t) => {
	const sff = new SF2File("file.sf2");
	const vol = sff.findPreset({ bankId: 0, presetId: 0, key: 60, vel: 70 })[0].volEnv;
	const sr = 48000;
	const {
		phases: { delay, attack, hold, decay, release },
		sustain,
	} = vol;
	const g = new Envelope([delay, attack, hold, decay, release], sustain, sr);
	t.is(g.stages[0], Math.pow(2, vol.phases.hold / 1200) * sr);
	for (const v of g.iterator()) {
		//  //console.log(v);
		//   //console.log(centidb2gain(v));
	}
});
test("1 second ramp up, 1 second ramp down, sr 1000", (t) => {
	const [delay, attack, hold, decay, release] = [-12000, 1200, -12000, 1200, -12000];
	const env = new Envelope({ delay, attack, hold, decay, release }, 960, 1000);
	t.is(env.egval, 0);
	t.is(env.ampCB, dbfs);
	t.is(env.gain, Math.pow(10, -dbfs / 200));
	env.shift(15);
	//console.log(env.stages, env.ampCB);
	t.is(env.stage, 1);
	t.assert(env.ampCB - dbfs * 0.985 < 100);
});
