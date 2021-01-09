import { EventEmitter } from "events";
import { TempoEvent, TimeSignatureEvent } from "@tonejs/midi/dist/Header";
export type seconds = number;
export type NoteEvent = {
  start: seconds;
  trackId: number;
  end: seconds;
  velocity: number;
  ticks: Ticks;
  durationTicks: number;
  durationTime: seconds;
  instrument: string;
  midi: number;
  name: string;
};

export type Ticks = number;
export type CallbackFunction = (notes: NoteEvent[]) => Promise<Ticks>;

export type Filename = string;

export type SSRState = {
  time: number;
  paused: boolean;
  source: Filename;
};
export type CSVFile = string;
export type MidiFile = string;
export type ControllerState = {
  paused: boolean;
  stop: boolean;
  midifile: MidiFile;
  time: number;
  tempo: TempoEvent;
  duration: number;
  timeSignature: TimeSignatureEvent;
};
export type RemoteControl = {
  pause: () => void;
  resume: () => void;
  config?: () => void;
  ff: () => void;
  rwd: () => void;
  seek: (time: number) => void;
  next: () => void;
  start: () => void;
  state: ControllerState;
  stop: () => void;
  emitter: EventEmitter;
  setCallback: (cb: CallbackFunction) => void;
  meta: any;
};
