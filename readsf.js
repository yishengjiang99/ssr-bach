import { readAB } from "./arraybuffer-reader.js";
import { fetchWithRange } from "./fetch-utils.js";
import { PDTA } from "./pdta.js";
async function loadHeader(url) {
  const res = await fetchWithRange(url, "0-4096");
  const arb = await res.arrayBuffer();
  const r = readAB(arb);
  const { getStr, getUint32 } = r;

  const [riff, filesize, sfbk, list, infosize] = [
    getStr(4),
    getUint32(),
    getStr(4),
    getStr(4),
    getUint32(),
  ];
  r.skip(infosize);
  // r.offset += infosize + 4; //skoip to pdta and get its size
  const list2 = getStr(4);
  const sdtaByteLength = getUint32();
  console.log(getStr(4));

  const smplStartByte = r.ftell();
  const pdtaStartByte = smplStartByte + sdtaByteLength + 4;
  return [smplStartByte, sdtaByteLength, pdtaStartByte];
}

export const fetchSoundFont = async (url) => {
  const [sdtaStart, sdtaLength, pdtaStart] = await loadHeader(url);
  const rb = await (await fetchWithRange(url, pdtaStart + "-")).arrayBuffer();
  const pdta = new PDTA();

  const sdta = await loadsdta(url, sdtaStart, sdtaLength);
  return {
    pdta,
    sdta,
  };
};
async function loadsdta(url, start, length) {
  const sdtaRange = `${start}-${start + length}`;
  const res = await fetchWithRange(url, sdtaRange);
  const wasm_page_size = 1024 * 56;
  const pages = Math.ceil((length * 3 * 2) / wasm_page_size) + 50;
  const { memory, load } = await loadwasm("sdta.wasm", pages);
  const r = res.body.getReader();
  let offset = 0;
  while (true) {
    const { done, value } = await r.read();
    if (done) break;
    memory.set(value, offset);
    offset += value.length;
  }
  const stackStart = 50 * wasm_page_size;
  //@ts-ignore
  load(stackStart, stackStart + length);
  return {
    bit16s: new Int16Array(memory.buffer, stackStart, length / 2),
    data: new Float32Array(memory.buffer, stackStart + length, length / 2),
  };
}

export const generatorNames = `#define SFGEN_startAddrsOffset         0
#define SFGEN_endAddrsOffset           1
#define SFGEN_startloopAddrsOffset     2
#define SFGEN_endloopAddrsOffset       3
#define SFGEN_startAddrsCoarseOffset   4
#define SFGEN_modLfoToPitch            5
#define SFGEN_vibLfoToPitch            6
#define SFGEN_modEnvToPitch            7
#define SFGEN_initialFilterFc          8
#define SFGEN_initialFilterQ           9
#define SFGEN_modLfoToFilterFc         10
#define SFGEN_modEnvToFilterFc         11
#define SFGEN_endAddrsCoarseOffset     12
#define SFGEN_modLfoToVolume           13
#define SFGEN_unused1                  14
#define SFGEN_chorusEffectsSend        15
#define SFGEN_reverbEffectsSend        16
#define SFGEN_pan                      17
#define SFGEN_unused2                  18
#define SFGEN_unused3                  19
#define SFGEN_unused4                  20
#define SFGEN_delayModLFO              21
#define SFGEN_freqModLFO               22
#define SFGEN_delayVibLFO              23
#define SFGEN_freqVibLFO               24
#define SFGEN_delayModEnv              25
#define SFGEN_attackModEnv             26
#define SFGEN_holdModEnv               27
#define SFGEN_decayModEnv              28
#define SFGEN_sustainModEnv            29
#define SFGEN_releaseModEnv            30
#define SFGEN_keynumToModEnvHold       31
#define SFGEN_keynumToModEnvDecay      32
#define SFGEN_delayVolEnv              33
#define SFGEN_attackVolEnv             34
#define SFGEN_holdVolEnv               35
#define SFGEN_decayVolEnv              36
#define SFGEN_sustainVolEnv            37
#define SFGEN_releaseVolEnv            38
#define SFGEN_keynumToVolEnvHold       39
#define SFGEN_keynumToVolEnvDecay      40
#define SFGEN_instrument               41
#define SFGEN_reserved1                42
#define SFGEN_keyRange                 43
#define SFGEN_velRange                 44
#define SFGEN_startloopAddrsCoarse     45
#define SFGEN_keynum                   46
#define SFGEN_velocity                 47
#define SFGEN_initialAttenuation       48
#define SFGEN_reserved2                49
#define SFGEN_endloopAddrsCoarse       50
#define SFGEN_coarseTune               51
#define SFGEN_fineTune                 52
#define SFGEN_sampleID                 53
#define SFGEN_sampleModes              54
#define SFGEN_reserved3                55
#define SFGEN_scaleTuning              56
#define SFGEN_exclusiveClass           57
#define SFGEN_overridingRootKey        58
#define SFGEN_unused5                  59
#define SFGEN_endOper                  60`
  .trim()
  .split("\n")
  .map((line) => line.split(/\s+/)[1])
  .map((token) => token.replace("SFGEN_", ""));
