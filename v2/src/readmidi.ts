import { execSync } from "child_process";
import { Reader, reader } from "./reader";
export function readMidi(file: string) {
  return execSync(`strings -o ${file}|grep -i mtrk`)
    .toString()
    .trim()
    .split("\n")
    .map((line: string, channelId: number) => {
      return parseChannel(file, channelId, parseInt(line.trim().split(/\s+/)[0]));
    });
}

function parseChannel(file: string, channelId: number, offset: number) {
  const r: Reader = reader(file);
  r.setOffset(offset);

  const info: any = [];
  let presetId = 0;
  let bankId = channelId == 9 ? 128 : 0;
  const events = [];

  console.log(r.read32String());
  let size = r.get32();
  let t = 0;
  const misc = [];
  const trackEnd = r.getOffset() + size;
  const pending: any = {};
  console.log(size);
  return;
  while (r.getOffset() < trackEnd) {
    const delay = r.readVarLength();
    const msg = r.get8();
    if (msg == 0xf7) break;
    t = t + delay;
    console.log(t, msg, r.getOffset());
    if (!msg) break;
    switch (msg) {
      case 0xff:
        const meta = r.get8();
        var len = r.readVarLength();
        info.push({
          msg,
          t,
          meta,
          details: r.readNString(len),
        });
        break;
      case 0xf2:
        return ["Song Position Pointer", r.get16()];
      case 0xf1:
        misc.push(["smpte:", [r.get8(), r.get8(), r.get8(), r.get8()]]);
        break;
      case 0xf3:
      case 0xf4:
        r.get8();
        break;
      case 0xf6:

      case 0xf8:
      case 0xfa:
      case 0xfb:
      case 0xfc:
        break;
      default:
        const channel = msg & 0x0f;
        const cmd = msg >> 4;
        switch (cmd) {
          case 0x08:
            const _note = r.get8();
            const _vel = r.get8();
            if (pending[_note]) {
              const duration = t - pending[_note].time;
              events.push({
                ...pending[_note],
                duration,
                noteOffVelocity: _vel,
              });
              delete pending[_note];
            }
            break;
          case 0x09:
            const note = r.get8();
            const vel = r.get8();
            pending[note] = {
              time: t,
              note,
              velocity: vel,
              presetId,
              bankId,
              channel,
            };
            break;
          case 0x0a:
            r.get8();
            r.get8();
            break;
          case 0x0b:
            r.get8();
            r.get8();
            break;
          case 0x0c:
            presetId = r.get8();
            break;
          case 0x0e:
            r.get8(), r.get8();
            break;
          default:
            r.get8();
            break;
        }
        break;
    }
  }

  return events;
}
readMidi("song.mid");
