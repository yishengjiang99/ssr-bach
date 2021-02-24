import { Workbook, stream } from "exceljs";
import { basename } from "path";
import { Writable } from "stream";
import { NoteEvent } from "./NoteEvent";
import { sleep } from "./utils";
import { convertMidi } from "./load-sort-midi";

export async function convertMidiSequencer({ file,output,page}: { page?:number, file: any; output?: Writable }):Promise<[][]>{
  const notesrec = [];
  const bitmap=[];
  page = page || 1;
  
  const controller = convertMidi(file, async (notes: NoteEvent[]) => {
    notes.map((note) =>
      notesrec.push({
        midi: note.midi,
        trackId: note.trackId,
        ticks: note.durationTicks / 256 / 8,
      })
    );
    const excelrow = new Array(88).fill('')
    for (let i = 0; i < notesrec.length; i++) {
      const note = notesrec[i];
      if (!note) continue;
      excelrow[note.midi - 21] = 1;
      note.ticks -= 256 / 8;
      if (note.ticks <= 0) {
        continue;
      }
    }
    while (notesrec[0] && notesrec[0].ticks <= 0) notesrec.shift();
    bitmap.push(excelrow);
    return .25;
  });;

    controller.start();
    await new Promise(r=>{
      controller.emitter.on("end",r);
      
      controller.emitter.on("#time",(info)=>{
        if(info.seconds > page * 100){
          controller.pause();
          r( 1);
        }
      })
    })
    return bitmap;

  }
