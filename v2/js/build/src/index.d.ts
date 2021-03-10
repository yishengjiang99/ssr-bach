export declare const worker: Worker;
export declare function start(midifile: string): Promise<void>;
export declare function initGain(ctx: AudioContext): [GainNode, HTMLInputElement];
