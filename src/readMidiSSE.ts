import { Readable } from "stream";
import { convertMidi } from "./load-sort-midi";
const [comma, rm, eventstr, datastr] = [",", "\n", "event: ", "data: "];

export const readMidiSSE = (midifile: string, realtime: boolean): Readable => {
  const { emitter } = convertMidi(midifile, realtime);
  const readable = new Readable({ read: () => "" });

  emitter.on("note", genEvent);
  emitter.on("#meta", genEvent);
  emitter.on("#tempo", genEvent);

  proc.on("done", () => readable.emit("ended"));
  return readable;
};
