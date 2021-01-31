import { openSync, readSync } from "fs";
import { NoteEvent } from "./ssr-remote-control.types";

const bytesPerNote = 192000;
const fdMap = {};
export function resolveBuffer(note: NoteEvent, byteLength): Buffer {
  const file = `./fast-a-${note.instrumentNumber}-0-88.pcm`; //'+note. note.instrumentNumer

  if (!fdMap[file]) {
    fdMap[file] = openSync(file, "r");
  }
  const offset = (note.midi - 21) * bytesPerNote;
  const attackPortion = note.velocity / 127;
  const ob = Buffer.allocUnsafe(byteLength);
  if (byteLength < bytesPerNote) {
    readSync(fdMap[file], ob, 0, byteLength, offset);
  } else {
    readSync(fdMap[file], ob, 0, bytesPerNote, offset);
    // readSync(fdMap[file], ob, bytesPerNote, byteLength - bytesPerNote, offset);
  }

  return ob;
}
