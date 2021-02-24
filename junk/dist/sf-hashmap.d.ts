/// <reference types="node" />
export declare const hashMapFile: (path: string) => {
    map: any;
    smplStart: number;
    mapPreset: (bankId: number, presetId: number) => void;
    smplData: (bankId: any, presetId: any, note: any, vel: any) => void;
    lookup: (bankId: number, presetId: number, key: number, vel: number) => any;
    serielize: () => string;
    fromJSON: (jsonStr: string) => void;
};
export declare const hasMapBuffer: (buffer: Buffer) => {
    map: any;
    smplStart: number;
    mapPreset: (bankId: number, presetId: number) => void;
    smplData: (bankId: any, presetId: any, note: any, vel: any) => void;
    lookup: (bankId: number, presetId: number, key: number, vel: number) => any;
    serielize: () => string;
    fromJSON: (jsonStr: string) => void;
};
