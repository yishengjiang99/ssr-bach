import "./libs.js";
document.body.id = "mocha";
mocha.setup("bdd");
const expect = globalThis.chai.expect;

describe("sf2d.js", () => {
	let worker;
	it("worker load wasm", async () => {
		worker = new Worker("sf2d.js");

		// await
		await new Promise((res, reject) => {
			worker.onmessage = ({ data: { ready } }) => (ready == 1 ? res(true) : reject());
		});
		expect(true);
	}).timeout(200000);
	it("loads rogra", async () => {
		worker.postMessage({ setProgram: { channel: 1, pid: 2 } });

		await new Promise((r) => {
			worker.onmessage = ({ data: { preset } }) => {
				expect(preset).gt(0);
				r(preset);
			};
		});
	}).timeout(200000);
	it("loads note", async () => {
		// worker = new Worker("sf2d.js");

		// // await
		// await new Promise((res, reject) => {
		// 	worker.onmessage = ({ data: { ready } }) => (ready == 1 ? res(true) : reject());
		// });
		// worker.postMessage({ setProgram: { channel: 1, pid: 2 } });
		// await new Promise((r) => {
		// 	worker.onmessage = ({ data: { preset } }) => {
		// 		expect(preset).gt(0);
		// 		r(preset);
		// 	};
		// });
		worker.postMessage({ noteOn: { channel: 1, key: 33, vel: 88 } });
		worker.postMessage({ noteOn: { channel: 1, key: 53, vel: 88 } });
		worker.postMessage({ noteOn: { channel: 1, key: 32, vel: 88 } });
		worker.postMessage({ noteOn: { channel: 1, key: 77, vel: 88 } });
		worker.postMessage({ setProgram: { channel: 12, pid: 34 } });
		worker.postMessage({ setProgram: { channel: 11, pid: 0 } });
		worker.postMessage({ setProgram: { channel: 15, pid: 22 } });
		worker.postMessage({ noteOn: { channel: 1, key: 77, vel: 88 } });
		worker.postMessage({ setProgram: { channel: 12, pid: 34 } });
		worker.postMessage({ setProgram: { channel: 11, pid: 0 } });
		worker.postMessage({ setProgram: { channel: 15, pid: 22 } });
		worker.postMessage({ noteOn: { channel: 1, key: 77, vel: 88 } });
		worker.postMessage({ setProgram: { channel: 1, pid: 34 } });
		worker.postMessage({ setProgram: { channel: 4, pid: 0 } });
		worker.postMessage({ setProgram: { channel: 5, pid: 22 } });
		worker.postMessage({ noteOn: { channel: 1, key: 77, vel: 88 } });

		worker.postMessage({ noteOn: { channel: 11, key: 77, vel: 88 } });
		worker.postMessage({ noteOn: { channel: 15, key: 33, vel: 11 } });
		worker.postMessage({ noteOn: { channel: 12, key: 22, vel: 123 } });
		worker.postMessage({ noteOn: { channel: 1, key: 55, vel: 55 } });

		expect(true);
	});
});

mocha.run();
