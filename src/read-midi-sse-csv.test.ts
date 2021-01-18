import { readMidiSSE } from "./read-midi-sse-csv";
import { Writable } from "stream";
test("csv/sse", (done): void => {
  const rc = readMidiSSE({
    midifile: "./midi/song.mid",
    response: new Writable({
      write: (chunk): void => {
        rc.stop();

        expect(chunk).toBeTruthy();
        rc.stop();
        done();
      },
    }),
    request: null,
    realtime: false,
  });
});
