"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readMidi = void 0;

function readMidi(buffer) {
    let offset = 0;

    function bufferReader(buffer) {
        const bl = buffer.byteLength;
        const dv = new DataView(buffer.buffer);
        const fgetc = () => offset < bl && dv.getUint8(offset++);
        const btoa = () => String.fromCharCode(fgetc());
        const read32 = () => (fgetc() << 24) | (fgetc() << 16) | (fgetc() << 8) | fgetc();
        const read16 = () => (fgetc() << 8) | fgetc();
        const read24 = () => (fgetc() << 16) | (fgetc() << 8) | fgetc();
        const fgets = (n) => (n > 1 ? btoa() + fgets(n - 1) : btoa());
        const fgetnc = (n) => (n > 1 ? fgetnc(n - 1).concat(fgetc()) : [fgetc()]);
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
            append: (buffer) => {

            }
        };
    }
    const reader = bufferReader(buffer);
    const { fgetc, btoa, read32, read16, read24, fgets, fgetnc, readVarLength } = reader;
    const chunkType = [btoa(), btoa(), btoa(), btoa()].join("");
    const headerLength = read32();
    const format = read16();
    const ntracks = read16();
    const division = read16();
    let g_time = -1000;
    const tracks = [];
    const limit = buffer.byteLength;
    const tempos = [];
    const metainfo = [];
    const timesigs = [];
    while (offset < limit) {
        const mhrk = [btoa(), btoa(), btoa(), btoa()].join("");
        let mhrkLength = read32();
        const endofTrack = offset + mhrkLength;
        tracks.push({ endofTrack, offset, time: 0, program: 0 });
        offset = endofTrack;
    }

    function readAt(g_time, cb) {
        for (const track of tracks) {
            offset = track.offset;
            while (track.time <= g_time && offset < track.endofTrack) {
                track.time += readVarLength();
                const event = readMessage(track);
            }
            track.offset = offset;
        }

        function readMessage(track) {
            const msg = fgetc();
            if (!msg)
                return false;
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
                                tempos.push({ tempo: read24() });
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
                        // console.log("meta ", msg, cmd, info);
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
                switch (cmd) {
                    case 0x08:
                        return {
                            channel,
                            notesOff: fgetc(),
                            vel: fgetc()
                        };
                    case 0x09:
                        const note = fgetc();
                        const vel = fgetc();
                        sp_hug(track.program, note, vel);
                        return {
                            channel,
                            notesOn: note,
                            vel: vel
                        };
                    case 0x0a:
                        return [fgetc(), fgetc()];;
                    case 0x0b:
                        return ["cc change", fgetc(), 'value', fgetc()];
                    case 0x0c:
                        track.program = fgetc();
                        break;
                    case 0x0e:
                        return ["0x0e", fgetc(), fgetc()];
                    default:
                        return [cmd, fgetc()];
                }
            }
        }
    }
    return {
        tracks,
        tempos,
        timesigs,
        metainfo,
        readAt,
        tick: (signal) => {
            g_time = g_time + 500;
            console.log(g_time);
            readAt(g_time, signal);
        }
    };
}
exports.readMidi = readMidi;
// const sp = spawn("./read_signal",{
//   stdio:['ipc','pipe','pipe']
// });
// sp.stderr.setEncoding("ascii");
// sp.stderr.pipe(process.stderr);
// sp.stdout.on("data",d=>console.log(d.toString()));
// sp.on("message",d=>{
//   console.log(d.toString())
// })
// sp.channel.ref()
// const  shift=11;
// let locked=0;
// let sp_hug=(sig)=> sp.kill(sig+shift);
// function send_signal(prog,note,vel){
//   if(locked) {
//     console.log(prog,note,vel,"wait lock");
//   }
//   locked=1;
//   [prog,note,vel].map(v=>v.toString(2).split("").map(b=>{
//     if(b=='0') sp_hug(0);
//     else sp_hug(1);
//   }));
//   sp_hug(16);
//   locked=0;
// }
// console.log(sp.pid);
// process.stdin.on("data",d=>{
//   const sign = parseInt(d.toString().trim());
//   switch(d.toString().trim()){
//     case "a": send_signal(0, 64, 100); break; //(1);break;
//     case "d": send_signal(0, 65, 80); break;
//     case "f": send_signal(0, 66, 84); break;
//     case "?":   console.log(sp);break;
//     case "c": tick(send_signal);break;
//     case "r":
//       setInterval(()=>{
//         tick(send_signal)
//       },250);
//       break;
//     default: break;
//   }
// })
// setInterval(()=>{
//   tick(send_signal)
// },250);