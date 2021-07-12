declare type AudioParamList = {
  [key: string]: Float32Array;
};
interface AudioWorkletProcessor {
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare var AudioWorkletProcessor: {
  prototype: AudioWorkletProcessor;
  new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
};
