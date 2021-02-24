"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resolvebuffer_1 = require("./resolvebuffer");
test("preload", () => {
    const [csv, buffer] = resolvebuffer_1.load();
    expect(csv.length).toBeGreaterThan(0);
    expect(csv[0]).toBeTruthy();
    console.log(csv[1]);
});
test("resolve", () => {
    const bufdex = resolvebuffer_1.findIndex(0, 44, 120);
    const buf = Buffer.allocUnsafe(48000 * 2 * 4);
    resolvebuffer_1.memcopy(bufdex, buf, 48000);
    for (let n = 4000; n > 0; n--) {
        const flsample = buf.readFloatLE(Math.floor(Math.random() * 50 / 4) * 4);
        expect(flsample).toBeDefined;
    }
});
