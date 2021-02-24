import { RemoteControl, MidiFile, CallbackFunction } from "./ssr-remote-control.types";
export declare function convertMidi(source: MidiFile, cb?: CallbackFunction): RemoteControl;
export declare function convertMidiRealTime(file: any): RemoteControl;
export declare const convertMidiASAP: (file: MidiFile) => RemoteControl;
export declare const msPerBeat: (bpm: any) => number;
export declare const secondsPerTick: (bpm: any) => number;
export declare const testNote: (midi: any) => {
    instrument: {
        percussion: boolean;
        number: number;
    };
    midi: any;
    durationTime: number;
    velocity: number;
};
