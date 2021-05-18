"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SFZone = exports.centidb2gain = exports.timecent2sec = exports.cent2hz = exports.SFGenerator = void 0;
const sf_types_js_1 = require("./sf.types.js");
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
class SFGenerator {
    constructor(_operator, int16) {
        this._operator = _operator;
        this.int16 = int16;
        this.from = 0;
        this.ibagId = -1;
        this.pbagId = -1;
    }
    add(modgen) {
        this.int16 += modgen.int16;
    }
    get operator() {
        return this._operator;
    }
    get range() {
        return { lo: this.int16 & 0x7f, hi: (this.int16 >> 8) & 0xff };
    }
    get u16() {
        return this.int16 & 0x0ff0; // | (this.hi << 8);
    }
    get s16() {
        return this.int16;
    }
    set s16(val) {
        this.int16 += val;
    }
}
exports.SFGenerator = SFGenerator;
function cent2hz(centiHz) {
    return 8.176 * Math.pow(2, centiHz / 1200.0);
}
exports.cent2hz = cent2hz;
function timecent2sec(timecent) {
    return Math.pow(2, timecent / 1200.0);
}
exports.timecent2sec = timecent2sec;
function centidb2gain(centibel) {
    return Math.pow(10, centibel / 200);
}
exports.centidb2gain = centidb2gain;
class SFZone {
    constructor(ids) {
        this.keyRange = { lo: -1, hi: 129 };
        this.velRange = { lo: -1, hi: 129 };
        this._shdr = {
            name: 'init',
            start: 0,
            end: 0,
            startLoop: 0,
            endLoop: 0,
            originalPitch: 60,
            sampleRate: -1,
            pitchCorrection: 0,
            sampleLink: 0,
            sampleType: 0,
        };
        this.sampleOffsets = [0, 0, 0, 0];
        this._modLFO = SFZone.defaultLFO;
        this._vibrLFO = SFZone.defaultLFO;
        this._modEnv = SFZone.defaultEnv;
        this._volEnv = SFZone.defaultEnv;
        this.lpf = { cutoff: 0, q: -1 };
        this.chorus = 0; /* chrous web %/10 */ /* chrous web %/10 */
        this.reverbSend = 0; /* percent of signal to send back.. in 0.1% units*/
        this.pan = -1; /* shift to right percent */
        this.attenuate = 0; /*db in attentuation*/
        this.instrumentID = -1;
        this._rootkey = -1;
        this.tuning = 0;
        this.sampleMode = sf_types_js_1.LOOPMODES.CONTINUOUS_LOOP;
        this.sampleID = -1;
        this.generators = [];
        if (ids) {
            if (ids.pbagId)
                this.pbagId = ids.pbagId;
            if (ids.ibagId)
                this.ibagId = ids.ibagId;
        }
    }
    serialize() {
        return {
            ...this,
            modLFO: this._modLFO,
            vibrLFO: this._vibrLFO,
            modEnv: this._modEnv,
            volEnv: this._volEnv,
            sample: this.sample,
        };
    }
    get modLFO() {
        if (this._modLFO) {
            this._modLFO = SFZone.defaultLFO;
        }
        return this._modLFO;
    }
    set modLFO(value) {
        this._modLFO = value;
    }
    get vibrLFO() {
        return this._vibrLFO;
    }
    set vibrLFO(value) {
        this._vibrLFO = value;
    }
    get modEnv() {
        return this._modEnv;
    }
    set modEnv(value) {
        this._modEnv = value;
    }
    get volEnv() {
        if (!this._modEnv) {
            this._modEnv = SFZone.defaultEnv;
        }
        return this._volEnv;
    }
    set volEnv(value) {
        this._volEnv = value;
    }
    get scaleTuning() {
        return this.generators[sf_types_js_1.sf_gen_id.scaleTuning]
            ? this.generators[sf_types_js_1.sf_gen_id.scaleTuning].s16
            : 0;
    }
    get keynumToVolEnvDecay() {
        return this.generators[sf_types_js_1.sf_gen_id.keynumToVolEnvDecay]
            ? this.generators[sf_types_js_1.sf_gen_id.keynumToVolEnvDecay].s16
            : 0;
    }
    get rootkey() {
        return this._rootkey > -1 ? this._rootkey : this.sample.originalPitch;
    }
    set rootkey(value) {
        this._rootkey = value;
    }
    get pitch() {
        return this.rootkey * 100 + this.tuning - this.sample.pitchCorrection;
    }
    set sample(shdr) {
        this._shdr = shdr;
    }
    get sample() {
        return {
            ...this._shdr,
            start: this._shdr.start + this.sampleOffsets[0],
            end: this._shdr.end + this.sampleOffsets[1],
            startLoop: this._shdr.startLoop + this.sampleOffsets[2],
            endLoop: this._shdr.endLoop + this.sampleOffsets[3],
        };
    }
    mergeWith(zoneb, from = 0) {
        for (const g of Object.values(zoneb.generators)) {
            this.applyGenVal(g, from);
        }
    }
    setVal(gen) {
        this.generators[gen.operator] = gen;
    }
    increOrSet(gen) {
        if (!this.generators[gen.operator])
            this.generators[gen.operator] = gen;
        else
            this.generators[gen.operator].s16 += gen.s16;
    }
    applyGenVals() {
        this.generators.forEach((g) => this.applyGenVal(g, -1));
    }
    applyGenVal(gen, from) {
        switch (gen.operator) {
            case startAddrsOffset:
                this.sampleOffsets[0] += gen.s16;
                break;
            case endAddrsOffset:
                this.sampleOffsets[1] += gen.s16;
                break;
            case startloopAddrsOffset:
                this.sampleOffsets[2] += gen.s16;
                break;
            case endloopAddrsOffset:
                this.sampleOffsets[3] += gen.s16;
                break;
            case startAddrsCoarseOffset:
                this.sampleOffsets[0] += gen.s16 << 15;
                break;
            case modLfoToPitch:
                this.modLFO.effects.pitch = gen.s16;
                break;
            case vibLfoToPitch:
                this.vibrLFO.effects.pitch = gen.s16;
                break;
            case modEnvToPitch:
                this.modEnv.effects.pitch = gen.s16;
                break;
            case initialFilterFc:
                this.lpf.cutoff = gen.s16;
                break;
            case initialFilterQ:
                this.lpf.q = gen.s16;
                break;
            case modLfoToFilterFc:
                this.modLFO.effects.filter = gen.s16;
                break;
            case modEnvToFilterFc:
                this.modEnv.effects.filter = gen.s16;
                break;
            case endAddrsCoarseOffset:
                this.sampleOffsets[1] += gen.s16 << 15;
                break;
            case modLfoToVolume:
                this.modLFO.effects.volume = gen.s16;
                break;
            case unused1:
            case chorusEffectsSend:
                this.chorus = gen.s16;
                break;
            case reverbEffectsSend:
                this.reverbSend = gen.s16;
                break;
            case pan:
                this.pan = gen.s16;
                break;
            case unused2:
            case unused3:
            case unused4:
                break;
            case delayModLFO:
                this.modLFO.delay = gen.s16;
                break;
            case freqModLFO:
                this.modLFO.freq = gen.s16;
                break;
            case delayVibLFO:
                this.vibrLFO.delay = gen.s16;
                break;
            case freqVibLFO:
                this.vibrLFO.freq = gen.s16;
                break;
            case delayModEnv:
                this.modEnv.phases.delay = gen.s16;
                break;
            case attackModEnv:
                this.modEnv.phases.attack = gen.s16;
                break;
            case holdModEnv:
                this.modEnv.default = false;
                this.modEnv.phases.hold = gen.s16; // timecent2sec(gen.s16);
                break;
            case decayModEnv:
                this.volEnv.default = false;
                this.modEnv.phases.decay = gen.s16; //timecent2sec(gen.s16);
                break;
            case sustainModEnv /* percent of fullscale*/:
                this.modEnv.default = false;
                this.modEnv.sustain = gen.s16;
                break;
            case releaseModEnv:
                this.modEnv.phases.release = gen.s16;
                break;
            case keynumToModEnvHold:
            case keynumToModEnvDecay:
                break;
            case delayVolEnv:
                this.volEnv.phases.delay = gen.s16;
                break;
            case attackVolEnv /*This is the time, in absolute timecents, from the end of the Volume
            Envelope Delay Time until the point at which the Volume Envelope
            value reaches its peak. Note that the attack is “convex”; the curve is
            nominally such that when applied to the decibel volume parameter, the
            result is linear in amplitude. A value of 0 indicates a 1 second attack
            time. A negative value indicates a time less than one second; a positive
            value a time longer than one second. The most negative number (-
            32768) conventionally indicates instantaneous attack. For example, an
            attack time of 10 msec would be 1200log2(.01) = -7973.*/:
                this.volEnv.phases.attack = gen.s16;
                break;
            case holdVolEnv:
                this.volEnv.phases.hold = gen.s16;
                break;
            case decayVolEnv:
                this.volEnv.default = false;
                this.volEnv.phases.decay = gen.s16; //timecent2sec(gen.s16);
                break;
            /** \']
            
            http://www.synthfont.com/SFSPEC21.PDF  is the decrease in level, expressed in centibels, to which the
            Volume Envelope value ramps during the decay phase. For the Volume
            Envelope, the sustain level is best expressed in centibels of attenuation
            from full scale. A value of 0 indicates the sustain level is full level; this
            implies a zero duration of decay phase regardless of decay time. A
            positive value indicates a decay to the corresponding level. Values less
            than zero are to be interpreted as zero; conventionally 1000 indicates
            full attenuation. For example, a sustain level which corresponds to an
      absolute value 12dB below of peak would be 120. */
            case sustainVolEnv:
                this.volEnv.sustain = gen.s16;
                this.volEnv.default = false;
                break;
            /*This is the time, in absolute timecents, for a 100% change in the
      Volume Envelope value during release phase. For the Volume
      Envelope, the release phase linearly ramps toward zero from the current
      level, causing a constant dB change for each time unit. If the current
      level were full scale, the Volume Envelope Release Time would be the
      time spent in release phase until 100dB attenuation were reached. A
      value of 0 indicates a 1-second decay time for a release from full level.
      SoundFont 2.01 Technical Specification - Page 45 - 08/05/98 12:43 PM
      A negative value indicates a time less than one second; a positive value
      a time longer than one second.  http://www.synthfont.com/SFSPEC21.PDF For example, . For example, a release time of 10 msec
      would be 1200log2(.01) = -7973. */
            case releaseVolEnv:
                this.volEnv.phases.release = gen.s16; //timecent2sec(gen.s16);
                break;
            case keynumToVolEnvHold:
            case keynumToVolEnvDecay:
                break;
            case instrument:
                this.instrumentID = gen.s16;
                break;
            case reserved1:
                break;
            case keyRange:
                this.keyRange.lo = Math.max(gen.range.lo, this.keyRange.lo);
                this.keyRange.hi = Math.min(gen.range.hi, this.keyRange.hi);
                break;
            case velRange:
                this.velRange = gen.range;
                break;
            case startloopAddrsCoarse:
                this.sampleOffsets[2] += gen.s16 << 15;
                break;
            case keynum:
                break;
            case velocity:
                break;
            case initialAttenuation:
                this.attenuate = gen.s16;
                break;
            case reserved2:
                break;
            case endloopAddrsCoarse:
                this.sampleOffsets[3] += gen.s16 << 15;
                // this._shdr.endLoop += 15 << gen.s16;
                break;
            case coarseTune:
                this.tuning += gen.s16 * 100; //semitone
                break;
            case fineTune:
                this.tuning += gen.s16; //tone
                break;
            case sampleID:
                //onsole.log('apply sample ' + gen.s16 + 'cur ');
                if (this.sampleID != -1) {
                    //throw 'applying to existing sample id';
                }
                this.sampleID = gen.s16;
                break;
            case sampleModes:
                break;
            case reserved3:
                break;
            case scaleTuning:
                break;
            case exclusiveClass:
                break;
            case overridingRootKey:
                if (gen.s16 > -1)
                    this.rootkey = gen.s16;
                break;
            case unused5:
                break;
            case endOper:
                break;
            default:
                throw 'unexpected operator';
        }
        gen.from = from || -1;
        if (from != -1)
            this.generators.push(gen);
    }
}
exports.SFZone = SFZone;
SFZone.defaultEnv = {
    default: true,
    phases: {
        decay: -1000,
        attack: -12000,
        delay: -12000,
        release: -3000,
        hold: -12000,
    },
    sustain: 300,
    effects: { pitch: 0, filter: 0, volume: 0 },
};
SFZone.defaultLFO = {
    delay: 0,
    freq: 1,
    effects: { pitch: 0, filter: 0, volume: 0 },
};
const { startAddrsOffset, endAddrsOffset, startloopAddrsOffset, endloopAddrsOffset, startAddrsCoarseOffset, modLfoToPitch, vibLfoToPitch, modEnvToPitch, initialFilterFc, initialFilterQ, modLfoToFilterFc, modEnvToFilterFc, endAddrsCoarseOffset, modLfoToVolume, unused1, chorusEffectsSend, reverbEffectsSend, pan, unused2, unused3, unused4, delayModLFO, freqModLFO, delayVibLFO, freqVibLFO, delayModEnv, attackModEnv, holdModEnv, decayModEnv, sustainModEnv, releaseModEnv, keynumToModEnvHold, keynumToModEnvDecay, delayVolEnv, attackVolEnv, holdVolEnv, decayVolEnv, sustainVolEnv, releaseVolEnv, keynumToVolEnvHold, keynumToVolEnvDecay, instrument, reserved1, keyRange, velRange, startloopAddrsCoarse, keynum, velocity, initialAttenuation, reserved2, endloopAddrsCoarse, coarseTune, fineTune, sampleID, sampleModes, reserved3, scaleTuning, exclusiveClass, overridingRootKey, unused5, endOper, } = sf_types_js_1.sf_gen_id;
