import { execSync } from "child_process";
import { readFileSync } from "fs";

const file = process.argv[2] || 'midi/song.mid';
const buffer = readFileSync("midi/song.mid");
const fileLimit = buffer.byteLength;

const tracks = execSync(`strings -o ${file}|grep -i mtrk`).toString().split("\n").map(line => {
  var _offset = parseInt(line.trim().split(" ")[0]);
  if(!_offset) return null;
  var t = 0;
  const fgetc = () => {
    if(_offset>=fileLimit) {
      console.trace();
      console.log(length);
      return null;
    
    }
    return buffer.readUInt8(_offset++);
  }
  const mthk = [fgetc(), fgetc(), fgetc(), fgetc()];
  const reader = {
    fgetc,
    fgets: (n) => {
      const _ = (n) => n == 1 ? fgetc() : [fgetc(), ..._(n - 1)];
      return _(n);
    },
    readVarLength: () => {
      let v = 0;
      let n = fgetc();
      if(!n) return 0;
      v = n & 0x7f;
      while (n & 0x80)
      {
        n = fgetc();
        v = (v << 7) | (n & 0x7f);
      }
      return v;
    },
    btoa: ()=>String.fromCharCode(fgetc()),
    read24:()=> (fgetc() << 16) | (fgetc() << 8) | fgetc(),
    read32: ()=>(fgetc() << 24) | (fgetc() << 16) | (fgetc() << 8) | fgetc(),
  };
  const length = reader.read32();

  const nextEvent = () => {
    if(_offset>fileLimit) return false;
    t += reader.readVarLength();
    const msg = fgetc();
    return msg < 0x80 ? systemMsg(msg, reader) : channelMsg(msg, reader);
  }
  return {
    length,
    _offset, nextEvent, reader, t
  }
}).filter(v=>v!=null);



function systemMsg(msg, reader) {
  const { fgetc, btoa, readVarLength, fgets, read24 } = reader;
  switch (msg)
  {
    case 0xff:
      switch (fgetc())
      {
        case 0x51:
         return{ ticksPerQuarterNote: read24()}
          break;
        default:
          return fgets(readVarLength());
      }
      break;
    case 0xf7:
      return ['sysEx', fgets(readVarLength())];
    case 0x7f:
      return ['endSysEx', fgets(readVarLength())];
    case 0xf2:
      return ["Song Position Pointer", fgets(2)];
    case 0xf1:
      return ["smte", fgetc(), fgetc(), fgetc(), fgetc()];
    case 0xf3:
    case 0xf4:
      console.log("icd,", fgetc());
      break;
    case 0xf6:
      console.log("list tunes");
      break;
    case 0xf7:
      console.log('endsysex');
      return []
    case 0xf8:
      console.log("timing");
      break;
    case 0xfa:
      console.log("start");
      break;
    case 0xfb:
      console.log("Continue");
      break;
    case 0xfc:
      console.log("stop");
      break;
    default:
      console.log(msg);
      break;
  }
  return true;
}

function channelMsg(msg, reader) {
  const { fgetc } = reader;
  const event = (msg >> 4);
  const channel = event & 0x0f;
  switch (event)
  {
    case 0x08:
      return {
        channel,
        notesOff: fgetc(),
        vel: fgetc()
      }
    case 0x09:
      return {
        channel,
        notesOn: fgetc(),
        vel: fgetc()
      }
    case 0x0a: return [fgetc(), fgetc()];;
    case 0x0b: return ["cc change", fgetc(), 'value', fgetc()];
    case 0x0c: return ['program number', fgetc()];
    case 0x0e: return ["0x0e", fgetc(), fgetc()];
    default: console.log("???", event); return event;



  }
}

var time = -1000;
let activeTracks=tracks;
setInterval(() => {
  console.log(time);
  activeTracks=activeTracks.filter(t=>t._offset<fileLimit);
  activeTracks.map(track => {
    while (track.t <= time + 1000){
      console.log(time,track._offset);
      const e=track.nextEvent();
      if(e===false) break;
      console.log(e)
    }
  });
  time += 250;
}, 250);
