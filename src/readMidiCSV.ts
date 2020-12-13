import { Readable } from "stream";
import { convertMidi } from "./load-sort-midi";
import { Filename } from "./ssr-remote-control.types";

export const readAsCSV = (midifile: Filename, realtime: boolean): Readable => {
  const { emitter } = convertMidi(midifile, realtime);
  const readable = new Readable({ read: () => "" });
  readable.push("instrument, start, duraton, velocity, noteoff velocity\n");
  emitter.on("note", (event) => {
    const {
      instrument,
      ticks,
      durationTicks,
      velocity,
      noteOffVelocity,
    } = event;
    readable.push(
      [instrument, ticks, durationTicks, velocity, noteOffVelocity].join(",") +
        "\n"
    );
  });
  emitter.on("#meta", (info) => {
    readable.push("#meta, " + JSON.stringify(info));
  });
  emitter.on("#tempo", (info) => {
    readable.push("#tempo, " + JSON.stringify(info));
  });
  emitter.on("done", () => readable.emit("ended"));
  return readable;
};
readAsCSV("./Beethoven-Symphony5-1.mid", false).pipe(process.stdout);
