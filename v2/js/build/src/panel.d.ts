export declare type NoteEvent = {
    midi: number;
    instrument: string;
    start: number;
    durationTime: number;
    trackId: number;
};
export declare class EventsPanel {
    private offset;
    private bars;
    private lookbackWindow;
    ended: boolean;
    evt: any;
    canvas: HTMLCanvasElement;
    constructor(offset?: number, bars?: NoteEvent[], lookbackWindow?: number);
    private styleCanvas;
    stop(): void;
    start(rtlink: string): Promise<void>;
    private prepareDraw;
}
