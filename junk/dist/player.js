"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const ssr_cxt_1 = require("ssr-cxt");
const load_sort_midi_1 = require("./load-sort-midi");
const utils_1 = require("./utils");
const sinks_1 = require("./sinks");
const resolvebuffer_1 = require("./resolvebuffer");
resolvebuffer_1.load();
class PulseTrackSource extends ssr_cxt_1.PulseSource {
    constructor(ctx, props) {
        super(ctx, { buffer: props.buffer });
        this.note = props.note;
        this.trackId = props.trackId;
        // this.envelope = new Envelope(48000, [
        //   ((145 - props.velocity) / 144) * 0.1,
        //   0.1,
        //   0.4,
        //   0.4,
        // ]);
    }
}
class Player {
    constructor() {
        this.nowPlaying = null;
        this.ctx = new ssr_cxt_1.SSRContext({
            nChannels: 1,
            bitDepth: 32,
            sampleRate: 31000,
            fps: 31,
        });
        this.settings = {
            preamp: 1,
            threshold: -60,
            ratio: 4,
            knee: -40,
            playbackRate: 1,
        };
        this.setSetting = (attr, value) => {
            this.settings[attr] = value;
        };
        this.lastPlayedSettings = null;
        this.stop = () => {
            if (this.nowPlaying)
                this.nowPlaying.stop();
            if (this.output)
                this.output.end();
            if (this.timer)
                clearInterval(this.timer);
        };
        this.msg = (msg, reply) => {
            let tt = msg.split(" ");
            const [cmd, arg1, arg2] = [tt.shift(), tt.shift(), tt.shift()];
            if (cmd === "config") {
                this.setSetting(arg1, parseFloat(arg2));
                return reply.write("ack config " + arg1 + " " + arg2);
            }
            if (this.nowPlaying && cmd === "seek") {
                this.nowPlaying.seek(parseInt(arg1));
                return reply.write({ rcstate: { seek: this.nowPlaying.state.time } });
            }
            switch (cmd) {
                case "resume":
                    this.nowPlaying.resume();
                    break;
                case "stop":
                    this.nowPlaying.stop();
                    this.nowPlaying.emitter.removeAllListeners();
                    break;
                case "pause":
                    this.nowPlaying.pause();
                    break;
                default:
                    reply.write("unknown handler " + cmd);
                    break;
            }
        };
        this.playTrack = (file, output, autoStart = true, playbackRate = 1) => {
            const ctx = this.ctx;
            const controller = load_sort_midi_1.convertMidi(file);
            this.nowPlaying = controller;
            this.tracks = new Array(controller.state.tracks.length);
            controller.setCallback(async (notes) => {
                const startloop = process.uptime();
                notes.map((note, i) => {
                    if (this.tracks[note.trackId]) {
                        this.tracks[note.trackId].buffer = Buffer.alloc(0);
                        this.tracks[note.trackId] = null;
                    }
                    const presetid = note.instrument.percussion ? utils_1.std_drums[note.instrument.number] : note.instrument.number;
                    this.tracks[note.trackId] = new PulseTrackSource(ctx, {
                        buffer: resolvebuffer_1.resolvebuffer(presetid, note.midi, note.velocity, note.durationTime),
                        note: note,
                        trackId: note.trackId,
                        velocity: note.velocity
                    });
                });
                const elapsed = process.uptime() - startloop;
                await utils_1.sleep((ctx.secondsPerFrame * 1000) / playbackRate);
                return ctx.secondsPerFrame;
            });
            if (autoStart)
                controller.start();
            this.timer = setInterval(() => {
                const summingbuffer = new DataView(Buffer.alloc(ctx.blockSize).buffer);
                let inputViews = this.tracks
                    .filter((t, i) => t && t.buffer)
                    .map((t) => [t.read(), t]);
                const n = inputViews.length;
                for (let k = 0; k < ctx.blockSize - 4; k += 4) {
                    let sum = 0;
                    for (let j = n - 1; j >= 0; j--) {
                        sum =
                            sum +
                                inputViews[j][0].readFloatLE(k);
                    }
                    summingbuffer.setFloat32(k, sum, true);
                }
                if (!output.writableEnded)
                    output.write(Buffer.from(summingbuffer.buffer));
            }, (ctx.secondsPerFrame * 1000) / playbackRate);
            this.output = output;
            output.on("close", () => {
                controller.stop();
                this.stop();
            });
            return controller;
        };
    }
}
exports.Player = Player;
if (process.argv[2]) {
    //  const pt = new PassThrough();
    new Player().playTrack(process.argv[2], sinks_1.ffp({ ac: 2, ar: 48000 })); // lowpassFiler(4000).stdout.pipe(ffp()));
}
