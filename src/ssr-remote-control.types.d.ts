import { EventEmitter } from "events";

export type Filename = string;
export type RemoteControl = {
  pause: () => void;
  resume: () => void;
  ff: () => void;
  rwd: () => void;
  next: () => void;
  emitter: EventEmitter;
};
export type SSRState = {
  time: number;
  paused: boolean;
  source: Filename;
};
export type CSVFile = string | "ss";
