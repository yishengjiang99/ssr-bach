import { SFZone, SFGenerator } from './Zone.js';
import { IBag, InstrHeader, Mod, Pbag, Phdr } from './pdta.types.js';
import { IReadAB } from './aba.js';
import { Shdr } from './index.js';
declare type findPresetFnType = (pid: number, bank_id?: number, key?: number, vel?: number) => SFZone[];
export declare class PDTA {
    phdr: Phdr[];
    pbag: Pbag[];
    pgen: SFGenerator[];
    pmod: Mod[];
    iheaders: InstrHeader[];
    igen: SFGenerator[];
    imod: Mod[];
    ibag: IBag[];
    shdr: Shdr[];
    findPreset: findPresetFnType;
    findInstrument: (instId: number, key: number, vel: number) => {
        inst: InstrHeader;
        defaultBg: SFZone;
        izones: SFZone[];
    };
    constructor(r: IReadAB);
    private addPbagToPreset;
    private psh;
    getIbagZone(ibagId: number): SFZone;
}
export {};
