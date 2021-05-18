export class SynthChannel {
    constructor(ctx, sffile) {
        this.program = [0, 0];
        this.queue = [];
        this.activeZones = [];
        this.key = 0;
        this.velocity = 0;
        this.ctx = ctx;
        this.sffile = sffile;
        this.preamp = new GainNode(ctx, { gain: 1 });
        this.ampVol = new GainNode(ctx, { gain: 0 });
        this.lpf = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 9200, Q: 0 });
        this.modLFO = new OscillatorNode(ctx, { type: "triangle", frequency: 60 });
        this.vibrLFO = new OscillatorNode(ctx, {
            type: "triangle",
            frequency: 60,
        });
        this.modLFO.connect(this.lpf.detune);
        this.preamp.connect(ctx.destination);
    }
}
function passthrough(ctx) {
    return ctx.createGain();
}
