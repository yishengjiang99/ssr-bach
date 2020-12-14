import { Readable, Transform } from "stream";
import { readAsCSV } from "./readMidiCSV";
export const readMidiSSE = (midifile: string, realtime: boolean): Readable => {
  return readAsCSV(midifile, realtime).pipe(
    new Transform({
      transform: (chunk, _, cb) => {
        const firstcomman = chunk.indexOf(",");
        const event = chunk.slice(0, firstcomman);
        const data = chunk.slice(event.byteLength + 1);
        cb(null, ["event: ", event, "\n", "data: ", data, "\n\n"].join(""));
      },
    })
  );
};
