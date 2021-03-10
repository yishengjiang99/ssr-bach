export declare function initCtx(): Promise<{
    ctx: AudioContext;
    gainNode: GainNode;
    slider: HTMLInputElement;
    av: AnalyserNode;
}>;
