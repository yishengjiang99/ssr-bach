import { getSample } from "./resolve-buffer-source.js";
import { SF2File } from "../node_modules/parse-sf2/dist/index.js";
describe("resolve buffer source", () => {
    it("turns shdr into loop audio buffer src", async () => {
        const sff = await SF2File.fromURL("file.sf2");
        getSample(sff.pdta.shdr[1], new Float32Array(sff.sdta.floatArr));
    });
});
