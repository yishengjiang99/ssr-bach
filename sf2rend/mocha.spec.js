import { load_proc_controller } from "./proccontroller.js";
document.body.id = "mocha";
mocha.setup("bdd");
const expect = globalThis.chai.expect;
describe("mocha", () => {
	it("tests things", async () => {
		const proc = await load_proc_controller(
			new AudioContext(),
			"sm.sf2",
			console.log,
			console.error
		);
		expect(proc.port).exists;
		expect(proc.port.onmessageerror).not.null;
	});
});
mocha.run();
