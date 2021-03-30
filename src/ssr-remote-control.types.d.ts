import { EventEmitter } from "events";
import { TempoEvent, TimeSignatureEvent } from "@tonejs/midi/dist/Header";
import { ChildProcess } from "child_process";
import { Player } from "./player";
/*
   Server-Side Rendering of Low Latency 32-bit Floating Point Audio

  This file hosts two servers: @server:HttpsServer
    1. @server Https.Server traditional https which prints out the webpage (line 48-61), 
        and for streaming playback ()
    2. @wsServer WsServer  WebSocket server for interactivity with the stream (like a remote control)
*/
export type WebSocketRefStr = string;
export type SessionContext = {
  t?: any;
  player: Player;
  wsRef?: WebSocketRefStr; //used to message user via ws during playback
  rc?: RemoteControl; //this controls active playback + the data channel actively piping to their browser
  file?: string; //file being played
  who: string; //randomly assigned username,
  parts: string[]; //currently requested path;
  query: Map<string, string>; // /index.php?a=3&b=3
};
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
  instrumentNumber?: number;
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
  tracks?: { percussion: boolean; trackId: number; instrument: number; mute: boolean }[];
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
