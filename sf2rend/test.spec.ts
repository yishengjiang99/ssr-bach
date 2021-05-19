import { sfbkstream, PDTA } from "https://unpkg.com/parse-sf2@2.1.2/bundle.js";
document.body.id = "mocha";
mocha.setup("bdd");
const expect = globalThis.chai.expect;
describe("mocha", () => {
	it("tests things", () => {
		expect(true);
	});
});
mocha.run();
