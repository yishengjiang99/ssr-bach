import { Workbook, stream } from "exceljs";
import { basename } from "path";
import { Writable } from "stream";
import { NoteEvent } from "./ssr-remote-control.types";
import { sleep } from "./utils";
import { convertMidi } from "./load-sort-midi";

export function convertMidiSequencer({ file, output }: { file; output: Writable }) {
  const wbook = new Workbook();

  const ws = wbook.addWorksheet(basename(file), {
    properties: { showGridLines: false },
    pageSetup: {
      fitToWidth: 1,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
    },
    headerFooter: { firstHeader: "Hello Exceljs", firstFooter: "Hello World" },
    state: "visible",
  });

  let k = 0;
  let notesrec = [];
  const workbook = new stream.xlsx.WorkbookWriter({
    stream: output,
  });
  const controller = convertMidi(file, async (notes: NoteEvent[]) => {
    notes.map((note) =>
      notesrec.push({
        midi: note.midi,
        trackId: note.trackId,
        ticks: note.durationTicks / 256 / 8,
      })
    );
    let excelrow = new Array(88).fill(" ");
    for (let i = 0; i < notesrec.length; i++) {
      const note = notesrec[i];
      if (!note) continue;
      excelrow[note.midi - 21] = 1;
      note.ticks -= 256 / 8;
      if (note.ticks <= 0) {
        continue;
        //notesrec.splice(i, 1);
      }
    }

    ws.addRow(excelrow).commit();
    console.log(excelrow.join(" "));
    while (notesrec[0] && notesrec[0].ticks <= 0) notesrec.shift();
    await sleep(10);
    return 0.01;
  });
  return wbook;
}
