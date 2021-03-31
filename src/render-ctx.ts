import { SF2File } from './sffile';
import { LUT } from './LUT';
import { Runtime } from './runtime';
import { Writable } from 'node:stream';
import { loop } from './Utils';

export class RenderCtx {
  sampleRate: number = 48000;
  fps: 350 = 350;
  voices: Runtime[] = [];
  outputCard: Buffer = Buffer.alloc(1024);
  programs: { presetId: number; bankId: number }[];
  staging = {
    queue: new Array(this.fps * 10).fill([]),
    index: 0,
  };
  get productionNow() {
    return this.staging.queue[this.staging.index];
  }
  pushToProduction() {
    while (this.productionNow.length) {
      const { channelId, rt, keyoff } = this.productionNow.shift();
      if (keyoff == 1 && this.voices[channelId]) {
        this.voices[channelId]?.mods.ampVol.triggerRelease();
        this.voices[channelId].length = this.voices[
          channelId
        ]?.mods.ampVol.stages[4];
        console.log('v off', channelId);
      }
      if (rt) {
        this.voices[channelId] = rt;
        console.log('v on', channelId);
      }
    }
    this.staging.index++;
    if (this.staging.index >= this.fps * 10) this.staging.index = 0;
  }
  constructor(private sff: SF2File) {
    LUT.init();
    this.programs = [
      { presetId: 0, bankId: 0 },
      { presetId: 0x08, bankId: 0 },
      { presetId: 0x10, bankId: 0 },
      { presetId: 0x18, bankId: 0 },
      { presetId: 0x20, bankId: 0 },
      { presetId: 0x28, bankId: 0 },
      { presetId: 0x30, bankId: 0 },
      { presetId: 0x38, bankId: 0 },
      { presetId: 0x40, bankId: 0 },
      { presetId: 0, bankId: 128 },
      { presetId: 0x50, bankId: 0 },
      { presetId: 0x60, bankId: 0 },
      { presetId: 0x70, bankId: 0 },
    ];
  }

  private _masterVol: number = 120;
  public get masterVol(): number {
    return this._masterVol;
  }
  public set masterVol(value: number) {
    this._masterVol = value;
  }
  /* db attentuate.. */
  private _chanVols: number[] = new Array(16).fill(70);
  public get chanVols(): number[] {
    return this._chanVols;
  }
  public set chanVols(value: number[]) {
    this._chanVols = value;
  }

  keyOn(key, vel, delay = 0, channelId = 0) {
    //if (channelId > 6) return;
    const { presetId, bankId } = this.programs[channelId];

    const zones = this.sff.findPreset({
      bankId,
      presetId,
      key,
      vel,
    });

    if (!zones || !zones.length) return;

    const rt = new Runtime(
      zones[0],
      {
        key: key,
        velocity: vel,
        channel: channelId,
      },
      this
    );
    if (delay == 0) {
      this.voices[channelId] = rt;
    } else {
      this.staging.queue[this.staging.index + delay * this.fps + 1].push({
        channelId,
        rt,
      });
    }
    return rt;
  }

  keyOff(channelId, delay) {
    let scheduledIndex = Math.floor(this.staging.index + delay * this.fps);

    if (scheduledIndex >= this.fps * 10)
      scheduledIndex = scheduledIndex - this.fps * 10;
    this.staging.queue[scheduledIndex].push({
      channelId,
      keyoff: 1,
    });
  }
  _render(voice: Runtime, outputArr: Buffer, blockLength, n) {
    const input: Buffer = this.sff.sdta.data;
    const looper = voice.sample.endLoop - voice.sample.startLoop;
    let shift = 0.0;
    let iterator = voice.iterator || voice.sample.start;
    // const pitch = LUT.relPC[~~voice.staticLevels.pitch];

    for (let offset = 0; offset < blockLength; offset++) {
      const { volume, pitch, filter } = voice.run(1);
      const outputByteOffset = offset * Float32Array.BYTES_PER_ELEMENT * 2;
      let currentVal = outputArr.readFloatLE(outputByteOffset);
      if (isNaN(currentVal)) currentVal = 0.0;
      let newVal;
      if (offset > 1) {
        const [vm1, v0, v1, v2] = [-1, 0, 1, 2].map((i) =>
          input.readFloatLE((iterator + i) * 4)
        );
        newVal = hermite4(shift, vm1, v0, v1, v2);
      } else {
        newVal = input.readFloatLE(iterator * 4);
      }

      let sum = currentVal + newVal * volume;

      outputArr.writeFloatLE(
        sum * voice.staticLevels.pan.left,
        outputByteOffset
      );
      outputArr.writeFloatLE(
        sum * voice.staticLevels.pan.right,
        outputByteOffset + 4
      );

      shift += pitch;

      while (shift >= 1) {
        iterator++;
        shift--;
      }

      if (iterator >= voice.sample.endLoop) {
        iterator -= looper;
      }
    }

    voice.length -= blockLength;
    voice.iterator = iterator;
  }
  output: Writable;
  render(blockSize) {
    this.pushToProduction();
    const ob = Buffer.alloc(blockSize * Float32Array.BYTES_PER_ELEMENT * 2);
    loop(blockSize * 2, (n) =>
      ob.writeFloatLE(0, n * Float32Array.BYTES_PER_ELEMENT)
    );
    const activev = this.voices.filter((v) => v.length && v.length > 0);
    activev.forEach((voice) => {
      this._render(voice, ob, blockSize, activev.length);
    });
    return ob;
  }
  start() {
    let n = 0;
    let that = this;
    function loopr() {
      that.output.write(that.render(128));
      n += 128;
      if (n < 48000) setTimeout(loopr, 3.5);
      else {
        that.output.end();
      }
    }
    loopr();
  }
}
export function hermite4(frac_pos, xm1, x0, x1, x2) {
  const c = (x1 - xm1) * 0.5;
  const v = x0 - x1;
  const w = c + v;
  const a = w + v + (x2 - x0) * 0.5;
  const b_neg = w + a;

  return ((a * frac_pos - b_neg) * frac_pos + c) * frac_pos + x0;
}
