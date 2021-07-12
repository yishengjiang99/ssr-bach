import { SFZone } from './Zone';
export declare type Phdr = {
    name: string;
    presetId: number;
    bankId: number;
    pbagIndex: number;
    pbags: number[];
    defaultBag: number;
    insts: number[];
};
export declare type Pbag = {
    pgen_id: number;
    pmod_id: number;
    pzone: SFZone;
};
export declare type IBag = {
    igen_id: number;
    imod_id: number;
    izone: SFZone;
};
export declare type Mod = {
    src: number;
    dest: number;
    amt: number;
    amtSrc: number;
    transpose: number;
};
export declare type InstrHeader = {
    name: string;
    iBagIndex: number;
    ibags?: number[];
    defaultIbag?: number;
};
