export interface IReadAB {
    skip: (arg0: number) => void;
    get8: () => number;
    get16: () => number;
    getS16: () => number;
    readN: (n: number) => Uint8Array;
    read32String: () => string;
    varLenInt: () => number;
    get32: () => number;
    readNString: (arg0: number) => string;
    offset: number;
}
export declare function readAB(arb: ArrayBuffer | Uint8Array): IReadAB;
