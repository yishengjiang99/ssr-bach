"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const sf_hashmap_1 = require("./sf-hashmap");
let ab = fs_1.readFileSync("./file.sf2");
test("hashmapfile", (done) => {
    let { lookup, mapPreset, map } = sf_hashmap_1.hasMapBuffer(ab); //"./file.sf2");;
    mapPreset(0, 0);
    const res = lookup(0, 0, 33, 127);
    expect(res).toBeDefined();
    done();
});
test("sf for midi", (done) => {
    let { lookup, mapPreset, map } = sf_hashmap_1.hasMapBuffer(ab); //"./file.sf2");;
    mapPreset(0, 0);
    expect(map[0]).toBeDefined();
    done();
});
