"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasMapBuffer = exports.hashMapFile = void 0;
const fs_1 = require("fs");
const SoundFont2_1 = require("SoundFont2");
const velMap_1 = require("./velMap");
const hashMapFile = (path) => {
    const ab = fs_1.readFileSync(path);
    if (!ab)
        throw 'no file ';
    return exports.hasMapBuffer(ab);
};
exports.hashMapFile = hashMapFile;
const hasMapBuffer = (buffer) => {
    const smplStart = buffer.indexOf("sdtasmpl");
    const sf = SoundFont2_1.SoundFont2.from(Uint8Array.from(buffer)); //(buffer);
    const adsrgen = [SoundFont2_1.GeneratorType.AttackVolEnv, SoundFont2_1.GeneratorType.ReleaseVolEnv, SoundFont2_1.GeneratorType.SustainVolEnv, SoundFont2_1.GeneratorType.DecayVolEnv];
    let map = {}; // { 0: {}, 9: {} };
    let ranges = [];
    let adsrdefaults = [-12000, -12000, 1000, -12000];
    const keymapUniq = new Set(velMap_1.keyMap);
    const velMapUniq = new Set(velMap_1.velMap);
    let mapKeyRange = (bankId, presetId, keyRange, velRange, info) => {
        keymapUniq.forEach((k) => {
            if (k <= keyRange.hi && k >= keyRange.lo) {
                map[bankId][presetId][k] = map[bankId][presetId][k] === null || {};
                velMapUniq.forEach(v => {
                    if (v <= velRange.hi && v >= velRange.lo) {
                        map[bankId][presetId][k][v] = info; //   map[bankId][presetId][k] || {};
                    }
                });
            }
        });
    };
    const mapPreset = (bankId, presetId) => {
        map[bankId] = map[bankId] || {};
        map[bankId][presetId] = map[bankId][presetId] || {};
        const p = sf.banks[bankId].presets[presetId];
        for (const z of p.zones) {
            let keyRange = { lo: 0, hi: 127 }, velRange = { lo: 0, hi: 127 };
            if (z.generators[SoundFont2_1.GeneratorType.VelRange])
                velRange = z.generators[SoundFont2_1.GeneratorType.VelRange].range;
            if (z.generators[SoundFont2_1.GeneratorType.KeyRange])
                keyRange = z.generators[SoundFont2_1.GeneratorType.KeyRange].range;
            for (const zone of z.instrument.zones) {
                if (zone.generators[SoundFont2_1.GeneratorType.VelRange])
                    velRange = zone.generators[SoundFont2_1.GeneratorType.VelRange].range;
                if (zone.generators[SoundFont2_1.GeneratorType.KeyRange])
                    keyRange = zone.generators[SoundFont2_1.GeneratorType.KeyRange].range;
                const { start, end, startLoop, endLoop, originalPitch, sampleRate } = zone.sample.header;
                const adsr = adsrgen.map((gen, i) => zone.generators[gen]?.amount || z.generators[gen]?.amount || adsrdefaults[i]);
                mapKeyRange(bankId, presetId, keyRange, velRange, { keyRange, velRange, start, end, startLoop, endLoop, originalPitch, sampleRate, adsr });
            }
        }
    };
    const lookup = (bankId, presetId, key, vel) => {
        if (vel <= 1)
            vel = vel * 0x7f;
        if (!map[bankId] || !map[bankId][velMap_1.keyMap[key]] || map[bankId][velMap_1.keyMap[key]][velMap_1.velMap[vel]]) {
            mapPreset(bankId, presetId);
        }
        const slice = map[bankId][presetId][velMap_1.keyMap[key]] || map[bankId][presetId][60];
        return slice[velMap_1.velMap[vel]];
    };
    return {
        map,
        smplStart,
        mapPreset,
        smplData: (bankId, presetId, note, vel) => {
            const lkup = lookup(bankId, presetId, note, vel);
            console.log(lkup);
        },
        lookup,
        serielize: () => JSON.stringify(map),
        fromJSON: (jsonStr) => {
            map = JSON.parse(jsonStr);
        }
    };
};
exports.hasMapBuffer = hasMapBuffer;
const { map, lookup, mapPreset, smplData } = exports.hasMapBuffer(fs_1.readFileSync("./file.sf2"));
mapPreset(0, 0);
console.log(lookup(0, 0, 44, 102));
smplData(0, 0, 33, 102);
smplData(0, 0, 32, 102);
smplData(0, 0, 44, 12);
smplData(0, 0, 44, 111);
smplData(0, 0, 44, 22);
smplData(0, 0, 44, 11);
