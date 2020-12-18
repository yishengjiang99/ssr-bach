import { Readable, Transform, Writable } from "stream";
import { convertMidi } from "./load-sort-midi";
export const readMidiSSE = (
  request: Readable,
  response: Writable,
  midifile: string,
  realtime: boolean
) => {
  const { emitter, ff, rwd, stop, pause, resume } = convertMidi(
    midifile,
    realtime
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
  const { emitter } = convertMidi(midifile, realtime);
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
        velocity,
        noteOffVelocity,
        instrument,
        trackId,
      ].join(",") + "\n"
    );
  });
  emitter.on("#meta", (info) => {
    readable.push("#meta, " + JSON.stringify(info) + "\n");
  });
  emitter.on("#tempo", (info) => {
    readable.push("#tempo, " + JSON.stringify(info) + "\n");
  });
  emitter.on("done", () => readable.emit("ended"));
  return readable;
};
