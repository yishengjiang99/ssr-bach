"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.parsePDTA = void 0;
var sfTypes = require("./sf.types");
var LUT_1 = require("./LUT");
var envAmplitue_1 = require("./envAmplitue");
var sampleId_gen = 53;
var velRangeGeneratorId = 44;
var keyRangeGeneratorId = 43;
var instrumentGenerator = 41;
var ShdrLength = 46;
var ibagLength = 4;
var imodLength = 10;
var phdrLength = 38;
var pbagLength = 4;
var pgenLength = 4;
var pmodLength = 10;
var instLength = 22;
function parsePDTA(r) {
    //const sections: Map<string, any> = new Map<string, any>();
    var n = 0;
    var pheaders = [], pbag = [], pgen = [], pmod = [], inst = [], igen = [], imod = [], ibag = [], shdr = [];
    do {
        var sectionName = r.read32String();
        var sectionSize = r.get32();
        switch (sectionName) {
            case "phdr":
                for (var i = 0; i < sectionSize; i += phdrLength) {
                    var phdrItem = {
                        name: r.readNString(20),
                        presetId: r.get16(),
                        bankId: r.get16(),
                        pbagIndex: r.get16(),
                        misc: [r.get32(), r.get32(), r.get32()]
                    };
                    pheaders.push(phdrItem);
                }
                break;
            case "pbag":
                for (var i = 0; i < sectionSize; i += pbagLength) {
                    var bag = {
                        pgen_id: r.get16(),
                        pmod_id: r.get16()
                    };
                    pbag.push(bag);
                }
                break;
            case "pgen":
                for (var i = 0; i < sectionSize; i += pgenLength) {
                    var _a = [r.get16(), r.get8(), r.get8()], operator = _a[0], lo = _a[1], hi = _a[2];
                    pgen.push({
                        operator: operator,
                        range: { lo: lo, hi: hi },
                        amount: lo | (hi << 8),
                        signed: hi & 0x80 ? -0x10000 + (lo | (hi << 8)) : lo | (hi << 8)
                    });
                }
                break;
            case "pmod":
                for (var i = 0; i < sectionSize; i += pmodLength) {
                    pmod.push({
                        src: r.get16(),
                        dest: r.get16(),
                        amt: r.get16(),
                        amtSrc: r.get16(),
                        transpose: r.get16()
                    });
                }
                break;
            case "inst":
                for (var i = 0; i < sectionSize; i += instLength) {
                    inst.push({
                        name: r.readNString(20),
                        iBagIndex: r.get16()
                    });
                }
                break;
            case "igen":
                for (var i = 0; i < sectionSize; i += 4) {
                    var _b = [r.get16(), r.get8(), r.get8()], operator = _b[0], lo = _b[1], hi = _b[2];
                    igen.push({
                        operator: operator,
                        range: { lo: lo, hi: hi },
                        amount: lo | (hi << 8),
                        signed: hi & 0x80 ? -0x10000 + (lo | (hi << 8)) : lo | (hi << 8)
                    });
                }
                break;
            case "imod":
                for (var i = 0; i < sectionSize; i += imodLength) {
                    imod.push({
                        src: r.get16(),
                        dest: r.get16(),
                        amt: r.get16(),
                        amtSrc: r.get16(),
                        transpose: r.get16()
                    });
                }
                break;
            case "ibag":
                for (var i = 0; i < sectionSize; i += ibagLength) {
                    ibag.push({
                        igen_id: r.get16(),
                        imod_id: r.get16()
                    });
                }
                break;
            case "shdr":
                for (var i = 0; i < sectionSize; i += ShdrLength ///20 + 4 * 5 + 1 + 1 + 4)
                ) {
                    nextShdr(r, shdr);
                }
                break;
            default:
                break; // `seciont name [${sectionName}]`;
        }
    } while (n++ < 8);
    var presets = {};
    for (var i = 0; i < pheaders.length - 1; i++) {
        var header = pheaders[i];
        presets[header.bankId] = presets[header.bankId] || {};
        var preset = __assign(__assign({}, header), { defaultBag: null, zones: [] });
        for (var pbagIndex = header.pbagIndex; pbagIndex < pheaders[i + 1].pbagIndex; pbagIndex++) {
            var _pbag = pbag[pbagIndex];
            var pgenMap = [];
            var pgenEnd = pbagIndex < pbag.length - 1 ? pbag[pbagIndex + 1].pgen_id : pgen[pgen.length - 1];
            for (var pgenIndex = _pbag.pgen_id; pgenIndex < pgenEnd; pgenIndex++) {
                var _pgen = pgen[pgenIndex];
                pgenMap[_pgen.operator] = _pgen;
            }
            if (pgenMap[sfTypes.generators.instrument] == null) {
                if (preset.defaultBag == null)
                    preset.defaultBag = makeZone(pgenMap, shdr, null);
            }
            else {
                var pbagZone = makeZone(pgenMap, shdr, preset.defaultBag);
                if (pbagZone.sample)
                    preset.zones.push(pbagZone);
                var instId = pgenMap[instrumentGenerator].amount;
                var instHeader = inst[instId];
                var nextIbagIndex = inst.length - 1 ? inst[instId + 1].iBagIndex : ibag.length - 1;
                for (var _ibagIndex = instHeader.iBagIndex; _ibagIndex < nextIbagIndex; _ibagIndex++) {
                    var _ibag = ibag[_ibagIndex];
                    var lastIgenIndex = _ibagIndex < ibag.length - 1 ? ibag[_ibagIndex + 1].igen_id : igen.length - 1;
                    var igenMap = [];
                    for (var igenIndex = _ibag.igen_id; igenIndex < lastIgenIndex; igenIndex++) {
                        var _igen = igen[igenIndex];
                        igenMap[_igen.operator] = _igen;
                    }
                    if (igenMap[sfTypes.generators.sampleID] &&
                        shdr[igenMap[sfTypes.generators.sampleID].amount]) {
                        var izone = makeZone(igenMap, shdr, preset.defaultBag);
                        if (izone.sample)
                            preset.zones.push(izone);
                    }
                }
            }
        }
        presets[header.bankId][header.presetId] = preset;
    }
    return { presets: presets, shdr: shdr, pheaders: pheaders, inst: inst };
}
exports.parsePDTA = parsePDTA;
function nextShdr(r, shdr) {
    var name = r.readNString(20);
    var _a = [
        r.get32(),
        r.get32(),
        r.get32(),
        r.get32(),
        r.get32(),
        r.get8(),
        r.get8(),
        r.get16(),
        r.get16(),
    ], start = _a[0], end = _a[1], startLoop = _a[2], endLoop = _a[3], sampleRate = _a[4], originalPitch = _a[5], pitchCorrection = _a[6], sampleLink = _a[7], sampleType = _a[8];
    shdr.push({
        name: name,
        start: start,
        end: end,
        startLoop: startLoop,
        endLoop: endLoop,
        sampleRate: sampleRate,
        originalPitch: originalPitch,
        pitchCorrection: pitchCorrection,
        sampleLink: sampleLink,
        sampleType: sampleType
    });
}
function makeZone(pgenMap, shdr, baseZone) {
    var _a, _b, _c;
    function getPgenVal(genId, type, defaultValue) {
        if (type === void 0) { type = "signed"; }
        if (defaultValue === void 0) { defaultValue = 0; }
        return ((pgenMap[genId] && pgenMap[genId][type]) ||
            (baseZone && baseZone.generators[genId] && baseZone.generators[genId][type]) ||
            defaultValue);
    }
    var samples = shdr[(_a = pgenMap[sampleId_gen]) === null || _a === void 0 ? void 0 : _a.amount] || null;
    adjustSmpls(samples, getPgenVal);
    var envelopPhases = [
        getPgenVal(sfTypes.generators.delayVolEnv, "signed", -12000),
        getPgenVal(sfTypes.generators.attackVolEnv, "signed", -11000),
        getPgenVal(sfTypes.generators.holdVolEnv, "signed", -12000),
        getPgenVal(sfTypes.generators.decayVolEnv, "signed", -11000),
        getPgenVal(sfTypes.generators.releaseVolEnv, "signed", 4000),
    ];
    var sustain = getPgenVal(sfTypes.generators.sustainVolEnv, "amounts", 1000);
    var tuning = (samples && {
        root: getPgenVal(sfTypes.generators.overridingRootKey, "signed"),
        originalPitch: samples.originalPitch,
        coarseTune: getPgenVal(sfTypes.generators.coarseTune, "amount", 0),
        fineTune: getPgenVal(sfTypes.generators.fineTune, "amount", 0)
    }) ||
        null;
    return {
        velRange: ((_b = pgenMap[velRangeGeneratorId]) === null || _b === void 0 ? void 0 : _b.range) || (baseZone === null || baseZone === void 0 ? void 0 : baseZone.velRange) || { lo: 0, hi: 127 },
        keyRange: ((_c = pgenMap[keyRangeGeneratorId]) === null || _c === void 0 ? void 0 : _c.range) || (baseZone === null || baseZone === void 0 ? void 0 : baseZone.keyRange) || { lo: 0, hi: 127 },
        envAmplitue: function (sr) { return envAmplitue_1.envAmplitue(envelopPhases, sustain, sr); },
        sample: samples,
        get generators() {
            return pgenMap;
        },
        pitchAjust: function (outputKey, sampleRate) {
            var root = tuning.root, originalPitch = tuning.originalPitch, fineTune = tuning.fineTune, coarseTune = tuning.coarseTune;
            var inputKey = root > 0 ? root : originalPitch;
            return ((Math.pow(2, ((outputKey - inputKey + coarseTune) * 100 - fineTune) / 1200) *
                samples.sampleRate) /
                sampleRate);
        },
        attenuation: getPgenVal(sfTypes.generators.initialAttenuation),
        gain: function (noteVelocity, midi_chan_vol, master_cc_vol) {
            var initialAttentuation = getPgenVal(sfTypes.generators.initialAttenuation, "signed");
            var centiDB = initialAttentuation +
                LUT_1.LUT.velCB[master_cc_vol] +
                LUT_1.LUT.velCB[midi_chan_vol] +
                LUT_1.LUT.velCB[noteVelocity];
            return LUT_1.LUT.cent2amp[centiDB];
        },
        pan: getPgenVal(sfTypes.generators.pan),
        misc: {
            envelopPhases: envelopPhases,
            sustain: sustain,
            tuning: tuning
        }
    };
}
function adjustSmpls(samples, getPgenVal) {
    if (samples != null) {
        var shoff = sfTypes.attributeGenerators.sampleOffsets.map(function (oper) {
            return getPgenVal(oper, "amount", 0);
        });
        samples.start += shoff[0];
        samples.end += shoff[1];
        samples.startLoop += shoff[2];
        samples.endLoop += shoff[3];
    }
}
