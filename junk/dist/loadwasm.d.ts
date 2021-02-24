/// <reference types="node" />
export declare function loadReader(): Promise<{
    sample: (presetId: number, midiNote: number, velocity: number, duration: number) => Buffer;
}>;
