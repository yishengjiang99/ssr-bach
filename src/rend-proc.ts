{
  // @ts-ignore
  class RenderProcessor extends AudioWorkletProcessor {
    readOffset: number;
    port: any;
    bufring: any;
    constructor() {
      super();
      this.readOffset = 0;
      const chunk = 128 * 4 * 2;
      this.port.onmessage = async ({ data: { srb } }) => {
        this.bufring = srb;
      };
    }

    process(inputs, outputs, parameters) {
      const fl = new DataView(this.bufring, this.readOffset * 1024);
      for (let i = 0; i < 128; i++) {
        outputs[0][0][i] = fl.getFloat32(8 * i, true);
        outputs[0][1][i] = fl.getFloat32(8 * i + 4, true);
      }
      return true;
    }
  }
  // @ts-ignore

  registerProcessor('rend-proc', RenderProcessor);
}
