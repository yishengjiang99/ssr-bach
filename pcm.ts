import { readFileSync } from "fs";
mv(readFileSync(process.argv[2]));
export function mv (buffer: Buffer) {
  let offset = 0;
  function bufferReader(buffer: Buffer) {
    const bl = buffer.byteLength;
    const dv = new DataView(buffer.buffer);
    const fgetc = () => offset < bl && dv.getUint8(offset++);
    const btoa = () => String.fromCharCode(fgetc());
    const read32 = () =>
      (fgetc() << 24) | (fgetc() << 16) | (fgetc() << 8) | fgetc();
    const read16 = () => (fgetc() << 8) | fgetc();
    const read24 = () => (fgetc() << 16) | (fgetc() << 8) | fgetc();
    const fgets = (n: number) => (n > 1 ? btoa() + fgets(n - 1) : btoa());

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
      readVarLength,
      fgets,
    };
  }
  const reader = bufferReader(buffer);
  const { fgetc, btoa, read32, read16, read24, fgets, readVarLength } = reader;
  console.log(offset);
  fgetc();
  console.log(offset);
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
  while (offset < limit) {
    const mhrk = [btoa(), btoa(), btoa(), btoa()].join("");
    let mhrkLength = read32();
    const endofTrack = offset + mhrkLength;

    while (offset < endofTrack && offset < limit) {
      //", endofTrack, "vs", limit);
      readMessage();
    }
    console.log("OEF inner while");

    function readMessage() {
      const deltaTime = readVarLength();

      const msg = fgetc();
      if (!msg) return false;
      let meta;

      let info: any[] = [];
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
                info.push(fgets(len));
                cmd = "etc";
                break;
              case 0x04:
                info.push(fgets(len));
                cmd = "instrument";
                break;
              case 0x51:
                info.push({ tempo: read24() });
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
                info.push({
                  qnpm: fgetc(),
                  beat: fgetc(),
                });
                info.push({
                  ticks: fgetc(),
                  measure: fgetc(),
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
        if (!keys[action]) {
          console.debug(cmd, msg);
          // process.exit();
        } else {
          const infos = keys[action].map((_) => fgetc());
          console.log([deltaTime, cmd, action, channel, ...infos].join("\t"));
        }
      }
    }
  }
}
