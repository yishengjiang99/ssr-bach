import { getSample } from "./resolve-buffer-source.js";
import { SF2File } from "../node_modules/parse-sf2/dist/index.js";
describe("resolve buffer source", () => {
	it("turns shdr into loop audio buffer src", (done) => {
		const sff = new OfflineAudioContext.fromUrl("file.sf2");
		getSample(sff.pdta.shdrs[1], sff.pdta);
		chai.expect(sff.shdrs[0]).toLe(42);
		chai.expect(sff.exists);
		done();
	});
	it("freebie", () => {});
});
