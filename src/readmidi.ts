import { readFileSync } from "fs";
import { notelist } from "./sound-font-samples";
import { std_inst_names } from "./utils";
export function readMidi(buffer: Buffer) {
  let offset = 0;
  function bufferReader(buffer: Buffer) {
    const bl = buffer.byteLength;
    const dv = new DataView(buffer.buffer);
    const fgetc = () => offset < bl && dv.getUint8(offset++);
    const btoa = () => String.fromCharCode(fgetc());
    const read32 = () => (fgetc() << 24) | (fgetc() << 16) | (fgetc() << 8) | fgetc();
    const read16 = () => (fgetc() << 8) | fgetc();
    const read24 = () => (fgetc() << 16) | (fgetc() << 8) | fgetc();
    const fgets = (n: number) => (n > 1 ? btoa() + fgets(n - 1) : btoa());
    const fgetnc = (n: number) => (n > 1 ? fgetnc(n - 1).concat(fgetc()) : [fgetc()]);
    const readVarLength = () => {
      let v = 0;
      let n = fgetc();
      v = n & 0x7f;
      while (n & 0x80) {
        n = fgetc();
        v = (v << 7) | (n & 0x7f);
      }
      return v;
    };
    return {
      fgetc,
      dv,
      btoa,
      read32,
      read16,
      read24,
      fgetnc,
      readVarLength,
      fgets,
    };
  }
  const reader = bufferReader(buffer);
  const { fgetc, btoa, read32, read16, read24, fgets, fgetnc, readVarLength } = reader;
  fgetc();
  readHeader();
  function readHeader() {
    const chunkType = [btoa(), btoa(), btoa(), btoa()].join("");
    const headerLength = read32();
    const format = read16();
    const ntracks = read16();
    const division = read16();
    console.log({ chunkType, headerLength, format, ntracks, division });
  }

  const tracks = [];
  const limit = buffer.byteLength;
  const tempos = [];
  const metainfo = [];
  const timesigs = [];
  while (offset < limit) {
    const mhrk = [btoa(), btoa(), btoa(), btoa()].join("");
    console.log(mhrk);
    let mhrkLength = read32();
    const endofTrack = offset + mhrkLength;
    let time = 0;
    const notes = [];
    const pending = {};

    const ccs = [];
    while (offset < endofTrack && offset < limit) {
      //", endofTrack, "vs", limit);
      readMessage();
    }

    tracks.push({
      notes,
      ccs,
    });

    function readMessage() {
      const deltaTime = readVarLength();
      time += deltaTime;
      const msg = fgetc();
      if (!msg) return false;
      let meta;

      let info = [];
      if (msg >= 0xf0) {
        switch (msg) {
          case 0xff:
            meta = fgetc();
            var len = readVarLength();
            let cmd = "";
            switch (meta) {
              case 0x01:
                cmd = "done";
                break;

              case 0x02:
              case 0x03:
              case 0x05:
              case 0x06:
              case 0x07:
                metainfo.push(fgets(len));
                cmd = "etc";
                break;
              case 0x04:
                info.push(fgets(len));
                cmd = "instrument";
                break;
              case 0x51:
                tempos.push({ tempo: read24(), time });
                cmd = "tempo";
                break;
              case 0x54:
                const [framerateAndhour, min, sec, frame, subframe] = [
                  fgetc(),
                  fgetc(),
                  fgetc(),
                  fgetc(),
                  fgetc(),
                ];
                const framerate = [24, 25, 29, 30][framerateAndhour & 0x60];
                const hour = framerate & 0x1f;
                info = JSON.stringify({
                  framerate,
                  hour,
                  min,
                  sec,
                  frame,
                  subframe,
                }).split(/,s+/);
                break;
              case 0x58:
                cmd = "timesig";
                timesigs.push({
                  qnpm: fgetc(),
                  beat: fgetc(),
                  ticks: fgetc(),
                  measure: fgetc(),
                  time,
                });

                break;
              case 0x59:
                info.push({
                  scale: fgetc() & 0x7f,
                });
                info.push({
                  majminor: fgetc() & 0x7f,
                });
                cmd = "note pitch change";
                break;
              case 0x2f:
                //END OF TRACK;
                break;
              default:
                cmd = "unkown " + meta;
                info.push({ "type:": meta, info: fgets(len) });
                break;
            }
            console.log("meta ", deltaTime, msg, cmd, info);
            break;
          case 0xf2:
            return ["Song Position Pointer", read16()];
          case 0xf1:
            console.log("smpte:", [fgetc(), fgetc(), fgetc(), fgetc()]);
            break;
          case 0xf3:
          case 0xf4:
            console.log("icd,", fgetc());
            break;
          case 0xf6:
            console.log("list tunes");
            break;
          case 0xf7:
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
            console.log("wtf");
            break;
        }
      } else {
        const channel = msg & 0x0f;
        const cmd = msg >> 4;

        const keys = {
          keyoff: ["note", "velocity"],
          keyon: ["note", "velocity"],
          aftertouch: ["note", "pressure"],
          ccontrolchange: ["control number", "value"],
          pgmchange: ["program #"],
          ChannelAftertouch: ["pressure"],
          PitchBend: ["pb1", "pb2"],
        };
        const actions = Object.keys(keys);
        const action = actions[cmd - 8];
        function process(action, infos) {
          switch (action) {
            case "pgmchange":
              infos = std_inst_names[infos[0]];
              break;

            case "keyon":
              pending[infos[0]] = {
                midi: infos[0],
                time,
                velocity: infos[1],
              };
              break;

            case "keyoff":
              const pendingNote = pending[infos[0]];
              if (pendingNote) {
                const note = {
                  ...pendingNote,
                  duration: time - pendingNote.time,
                  offVelocity: infos[1],
                };
                notes.push(note);
              }
              break;
            case "ccontrolchange":
              ccs.push({
                number: fgetc(),
                value: fgetc(),
              });
          }
          return infos;
        }
        if (!keys[action]) {
          console.debug("unknown msg", cmd, msg);
          // process.exit();
        } else {
          const infos = keys[action].map((info) => fgetc());
          process(action, infos);
        }
      }
    }
  }
  return {
    tracks,
    tempos,
    timesigs,
    metainfo,
  };
}
console.log(readMidi(readFileSync(process.argv[2])));
