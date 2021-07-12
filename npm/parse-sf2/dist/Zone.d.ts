import { sf_gen_id, Shdr, centibel, LOOPMODES, LFOParams, GenRange } from './sf.types.js';
export declare class SFGenerator {
    private _operator;
    private int16;
    from: number;
    ibagId: number;
    pbagId: number;
    constructor(_operator: sf_gen_id, int16: number);
    add(modgen: SFGenerator): void;
    get operator(): sf_gen_id;
    get range(): GenRange;
    get u16(): number;
    get s16(): number;
    set s16(val: number);
}
export declare function cent2hz(centiHz: number): number;
export declare function timecent2sec(timecent: number): number;
export declare function centidb2gain(centibel: number): number;
export declare type EnvParams = {
    default: boolean;
    phases: {
        decay: number;
        attack: number;
        delay: number;
        release: number;
        hold: number;
    };
    sustain: number;
    effects: {
        pitch: number;
        filter: number;
        volume: number;
    };
};
export declare class SFZone {
    keyRange: {
        lo: number;
        hi: number;
    };
    velRange: {
        lo: number;
        hi: number;
    };
    _shdr: Shdr;
    pbagId: number;
    ibagId: number;
    serialize(): this & {
        modLFO: {
            delay: number;
            freq: number;
            effects: {
                pitch: number;
                filter: number;
                volume: number;
            };
        };
        vibrLFO: {
            delay: number;
            freq: number;
            effects: {
                pitch: number;
                filter: number;
                volume: number;
            };
        };
        modEnv: EnvParams;
        volEnv: EnvParams;
        sample: Shdr;
    };
    sampleOffsets: number[];
    constructor(ids?: {
        pbagId?: number;
        ibagId?: number;
    });
    _modLFO: LFOParams;
    get modLFO(): {
        delay: number;
        freq: number;
        effects: {
            pitch: number;
            filter: number;
            volume: number;
        };
    };
    set modLFO(value: {
        delay: number;
        freq: number;
        effects: {
            pitch: number;
            filter: number;
            volume: number;
        };
    });
    private _vibrLFO;
    get vibrLFO(): {
        delay: number;
        freq: number;
        effects: {
            pitch: number;
            filter: number;
            volume: number;
        };
    };
    set vibrLFO(value: {
        delay: number;
        freq: number;
        effects: {
            pitch: number;
            filter: number;
            volume: number;
        };
    });
    private _modEnv;
    get modEnv(): EnvParams;
    set modEnv(value: EnvParams);
    private _volEnv;
    get volEnv(): EnvParams;
    set volEnv(value: EnvParams);
    lpf: {
        cutoff: number;
        q: number;
    };
    chorus: number;
    reverbSend: number;
    pan: number;
    attenuate: centibel;
    instrumentID: number;
    get scaleTuning(): number;
    get keynumToVolEnvDecay(): number;
    private _rootkey;
    get rootkey(): number;
    set rootkey(value: number);
    tuning: number;
    get pitch(): centibel;
    sampleMode: LOOPMODES;
    sampleID: number;
    generators: SFGenerator[];
    set sample(shdr: Shdr);
    get sample(): Shdr;
    mergeWith(zoneb: SFZone, from?: number): void;
    setVal(gen: SFGenerator): void;
    increOrSet(gen: SFGenerator): void;
    applyGenVals(): void;
    applyGenVal(gen: SFGenerator, from?: number): void;
    static defaultEnv: {
        default: boolean;
        phases: {
            decay: number;
            attack: number;
            delay: number;
            release: number;
            hold: number;
        };
        sustain: number;
        effects: {
            pitch: number;
            filter: number;
            volume: number;
        };
    };
    static defaultLFO: any;
}
