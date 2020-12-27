import { Readable, Transform, Writable } from "stream";
import {
  convertMidi,
  convertMidiASAP,
  convertMidiRealTime,
} from "./load-sort-midi";
export const readMidiSSE = (
  request: Readable,
  response: Writable,
  midifile: string,
  realtime: boolean
) => {
  const { emitter, ff, start, rwd, stop, pause, resume } = convertMidiRealTime(
    midifile
  );
  request.on("close", stop);
  request.on("data", (d) => {
    const req = d.toString().trim();
    switch (req) {
      case "pause":
        pause();
        break;
      case "resume":
        resume();
        break;
      case "ff":
        ff();
        break;
      case "rwd":
        rwd();
        break;
      default:
        break;
    }
  });

  ["note", "#meta", "#time", "#tempo"].map((event) => {
    emitter.on(event, (d) => {
      response.write(
        ["event: ", event, "\n", "data: ", JSON.stringify(d), "\n\n"].join("")
      );
    });
  });
};
export const readAsCSV = (midifile: string, realtime: boolean): Readable => {
  const { emitter, start } = convertMidiASAP(midifile);

  const readable = new Readable({ read: () => "" });
  emitter.on("note", (event) => {
    const {
      midi,
      instrument,
      ticks,
      durationTicks,
      velocity,
      noteOffVelocity,
      trackId,
    } = event;
    readable.push(
      [
        ticks,
        midi,
        durationTicks,
        velocity * 0x7f,
        noteOffVelocity,
        instrument,
        trackId,
        instrument,
      ].join(",") + "\n"
    );
  });
  emitter.on("#meta", (info) => {
    readable.push("#meta, " + JSON.stringify(info) + "\n");
  });
  emitter.on("#tempo", (info) => {
    readable.push("#tempo, " + JSON.stringify(info) + "\n");
  });
  emitter.on("end", () => readable.emit("end"));
  start();
  return readable;
};
