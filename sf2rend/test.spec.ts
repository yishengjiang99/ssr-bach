document.body.id = "mocha";
mocha.setup("bdd");
const expect = globalThis.chai.expect;
describe("mocha", () => {
	it("tests things", () => {
		expect(true);
	});
});
mocha.run();
