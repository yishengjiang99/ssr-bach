const heap = new WebAssembly.Memory({ initial: 10, maximum: 10, shared: true });
class RenderProcessor extends AudioWorkletProcessor {
    port;
    constructor() {
        super();
        // this.port.onmessageerror = console.log;
        this.port.onmessage = this.msgHandler.bind(this);
        this.port.start();
    }
    msgHandler({ data: { midistream, sf2config }, }) {
        const r = midistream.getReader();
        r.read().then(function process({ done, value }) {
            if (done)
                return;
            if (value) {
                console.log(value);
            }
        });
    }
    process(input, outputs) {
        render(rendctx);
        const flrr = new Float32Array(heap.buffer, rendctx);
        for (let j = 0; j < 128; j++) {
            outputs[0][0][j] = flrr.getFloat32(j * 4, true); //[i];
        }
    }
}
registerProcessor("rend-proc", RenderProcessor);
/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
import Module from "./rend.wasmmodule.js";
import { RENDER_QUANTUM_FRAMES, MAX_CHANNEL_COUNT, HeapAudioBuffer } from "./wasm-audio-helper.js";
/**
 * A simple demonstration of WASM-powered AudioWorkletProcessor.
 *
 * @class WASMWorkletProcessor
 * @extends AudioWorkletProcessor
 */
class WASMWorkletProcessor extends AudioWorkletProcessor {
    /**
     * @constructor
     */
    constructor() {
        super();
        // Allocate the buffer for the heap access. Start with stereo, but it can
        // be expanded up to 32 channels.
        this._heapInputBuffer = new HeapAudioBuffer(Module, RENDER_QUANTUM_FRAMES, 2, MAX_CHANNEL_COUNT);
        this._heapOutputBuffer = new HeapAudioBuffer(Module, RENDER_QUANTUM_FRAMES, 2, MAX_CHANNEL_COUNT);
        Module._init();
    }
    /**
     * System-invoked process callback function.
     * @param  {Array} inputs Incoming audio stream.
     * @param  {Array} outputs Outgoing audio stream.
     * @param  {Object} parameters AudioParam data.
     * @return {Boolean} Active source flag.
     */
    process(inputs, outputs, parameters) {
        // Use the 1st input and output only to make the example simpler. |input|
        // and |output| here have the similar structure with the AudioBuffer
        // interface. (i.e. An array of Float32Array)
        let input = inputs[0];
        let output = outputs[0];
        // For this given render quantum, the channel count of the node is fixed
        // and identical for the input and the output.
        let channelCount = input.length;
        // Prepare HeapAudioBuffer for the channel count change in the current
        // render quantum.
        this._heapInputBuffer.adaptChannel(channelCount);
        this._heapOutputBuffer.adaptChannel(channelCount);
        // Copy-in, process and copy-out.
        for (let channel = 0; channel < channelCount; ++channel) {
            this._heapInputBuffer.getChannelData(channel).set(input[channel]);
        }
        Module._process(this._heapInputBuffer.getHeapAddress(), this._heapOutputBuffer.getHeapAddress(), channelCount);
        for (let channel = 0; channel < channelCount; ++channel) {
            output[channel].set(this._heapOutputBuffer.getChannelData(channel));
        }
        return true;
    }
}
registerProcessor("wasm-worklet-processor", WASMWorkletProcessor);
