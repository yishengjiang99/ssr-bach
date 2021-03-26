export function readMidi(
  buffer: Uint8Array,
  cb: (str: string, obj?: any) => void
) {
  const reader = bufferReader(buffer);
  const {
    fgetc,
    offset,
    btoa,
    read32,
    read16,
    read24,
    readVarLength,
    fgets,
  } = reader;
  const chunkType = [btoa(), btoa(), btoa(), btoa()].join('');
  const headerLength = read32();
  const format = read16();
  const ntracks = read16();
  const division = read16();
  let g_time = -1000;
  type Track = {
    endofTrack: number;
    offset: number;
    time: number;
    program: number;
  };

  const tracks: Track[] = [];
  const limit = buffer.byteLength;
  const tempos: { tempo: number }[] = [];
  const metainfo: any[] = [];
  const timesigs: {
    qnpm: number | false;
    beat: number | false;
    ticks: number | false;
    measure: number | false;
  }[] = [];

  while (reader.offset < limit) {
    const mhrk = [btoa(), btoa(), btoa(), btoa()].join('');
    let mhrkLength = read32();
    const endofTrack = reader.offset + mhrkLength;
    tracks.push({ endofTrack, offset: reader.offset, time: 0, program: 0 });
    reader.offset = endofTrack;
  }

  function readAt(g_time: number) {
    for (const track of tracks) {
      reader.offset = track.offset;
      while (track.time <= g_time && reader.offset < track.endofTrack) {
        const deltaT = readVarLength();
        track.time += deltaT;

        readMessage(track, (cmd, obj) => cb(cmd, { ...obj, deltaT }));
      }
      track.offset = reader.offset;
    }
    function readMessage(track: { program: number | boolean }, onMsg) {
      const msg = fgetc();
      if (!msg) return false;
      let meta;

      let info = [];
      if (msg >= 0xf0) {
        switch (msg) {
          case 0xff:
            meta = fgetc();
            var len = readVarLength();
            let cmd = '';
            switch (meta) {
              case 0x01:
                cmd = 'Text Event';
              case 0x02:
                cmd = cmd || 'Copyright Notice';
              case 0x03:
                cmd = cmd || 'Sequence/Track Name';
              case 0x04:
                cmd = cmd || 'Instrument Name';
              case 0x05:
                cmd = cmd || 'Lyric';
              case 0x06:
                cmd = cmd || 'Marker';
              case 0x07:
                cmd = cmd || 'queue ptr';
                onMsg(cmd, fgets(len));
                break;

              case 0x51:
                const tempo = read24();
                onMsg('tempo', tempo);
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
                onMsg('SMPTE', {
                  framerate,
                  hour,
                  min,
                  sec,
                  frame,
                  subframe,
                });
                break;
              case 0x58:
                cmd = 'timesig';

                onMsg(cmd, {
                  qnpm: fgetc(),
                  beat: fgetc(),
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
                cmd = 'note pitch change';
                break;
              case 0x2f:
                //END OF TRACK;
                onMsg('end of track');
                break;
              default:
                cmd = 'unkown ' + meta;
                info.push({ 'type:': meta, info: fgets(len) });
                break;
            }
            // console.log("meta ", msg, cmd, info);
            break;
          case 0xf2:
            onMsg('Song Position Pointer', read16());
          case 0xf1:
            onMsg('smpte:', [fgetc(), fgetc(), fgetc(), fgetc()]);
            break;
          case 0xf3:
          case 0xf4:
            onMsg('icd,', fgetc());
            break;
          case 0xf6:
            console.log('list tunes');
            break;
          case 0xf7:
          case 0xf8:
            onMsg('timing');
            break;
          case 0xfa:
            onMsg('start');
            break;
          case 0xfb:
            onMsg('Continue');
            break;
          case 0xfc:
            onMsg('stop');
            break;
          default:
            console.log(msg);
            console.log('wtf');
            break;
        }
      } else {
        const channel = msg & 0x0f;
        const cmd = msg >> 4;
        switch (cmd) {
          case 0x08:
            onMsg('noteOff', {
              channel: channel,
              note: fgetc(),
              vel: fgetc(),
            });
            break;
          case 0x09:
            onMsg('noteOn', {
              channel: channel,
              note: fgetc(),
              vel: fgetc(),
            });
            break;

          case 0x0a:
            onMsg('polyaftertouch', {
              channel: channel,
              note: fgetc(),
              pressure: fgetc(),
            });
            break;
          case 0x0b:
            onMsg('channelMode', {
              channel: channel,
              cc: fgetc(),
              val: fgetc(),
            });
            break;
          case 0x0c:
            onMsg('Program', {
              channel: channel,
              program: fgetc(),
            });
            break;
          case 0x0e:
            onMsg('pitchWhell', {
              channel: channel,
              note: fgetc(),
              pressure: fgetc(),
            });
            break;
          default:
            break;
        }
      }
    }
  }

  return {
    tracks,
    readAt,
    readAll: () => readAt(Infinity),
    tick: () => {
      g_time = g_time + 155;
      readAt(g_time);
    },
    pump: (u8a: Uint8Array) => reader.pump(u8a),
  };
}
export function bufferReader(buffer: Uint8Array) {
  let _offset = 0,
    eos = false;
  const EOS = 'OES';
  let _buf = [buffer];
  let bl = buffer.byteLength;
  const fgetc = (): number => {
    if (eos) return 0x00;
    const ret = _buf[0][_offset];
    _offset++;
    ({ bl, eos } = checkeos(_offset, bl, _buf, eos));
    return ret;
  };
  const btoa = () => String.fromCharCode(fgetc());
  const read32 = () =>
    (fgetc() << 24) | (fgetc() << 16) | (fgetc() << 8) | fgetc();
  const read16 = () => (fgetc() << 8) | fgetc();
  const read24 = () => (fgetc() << 16) | (fgetc() << 8) | fgetc();
  const fgets = (n: number): string => (n > 1 ? btoa() + fgets(n - 1) : btoa());
  const fgetnc = (n: number): number[] =>
    n > 1 ? [fgetc(), ...fgetnc(n - 1)] : [fgetc()];
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
    pump: (ab: Uint8Array) => {
      _buf.push(ab);
    },
    get offset() {
      return _offset;
    },
    set offset(offset) {
      _offset = offset;
    },
    fgetc,
    btoa,
    read32,
    read16,
    read24,
    fgetnc,
    readVarLength,
    fgets,
  };
}
function checkeos(
  _offset: number,
  bl: number,
  _buf: Uint8Array[],
  eos: boolean
) {
  if (_offset > bl) {
    _buf.shift();
    if (_buf[0]) {
      bl = _buf[0].length;
    } else {
      eos = true;
    }
  }
  return { bl, eos };
}
