import { Midi } from "@tonejs/midi";
import { spawn } from "child_process";
import { existsSync, readFileSync } from "fs";
export const change_ext = (file, ext) => file.slice(0, file.lastIndexOf(".")) + "." + ext;

export function tagResponse(res, templateFn) {
  function tag(str: TemplateStringsArray, ...args: string[]) {
    for (const i in args) {
      res.write(str[i]);
      res.write(args[i]);
    }
    res.write(str[str.length - 1]);
  }

  tag(templateFn);
}

export const midiMeta = (midiFile: string) => {
  const { header, duration, tracks } = new Midi(readFileSync(midiFile));
  return {
    instruments: tracks.map((t) => {
      const json = t.instrument.toJSON();
      const stdname = std_inst_names[t.instrument.number];
      const onserver = existsSync("midisf/" + std_inst_names[t.instrument.number]);
      return { ...json, stdname, onserver };
    }),
    name: header.name,
    seconds: duration,
    ...header.meta,
  };
};

export const resjson = (res, obj) => {
  res.writeHead(200, {
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(obj));
};
export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
export const std_settings = "-f 32le -ar 48000 -ac 1";
export const std_inst_names = [
  "acoustic_grand_piano",
  "bright_acoustic_piano",
  "electric_grand_piano",
  "honkytonk_piano",
  "electric_piano_1",
  "electric_piano_2",
  "harpsichord",
  "clavinet",
  "celesta",
  "glockenspiel",
  "music_box",

  "vibraphone",
  "marimba",
  "xylophone",
  "tubular_bells",
  "dulcimer",
  "drawbar_organ",
  "percussive_organ",
  "rock_organ",
  "church_organ",
  "reed_organ",
  "accordion",
  "harmonica",
  "tango_accordion",
  "acoustic_guitar_nylon",
  "acoustic_guitar_steel",
  "electric_guitar_jazz",
  "electric_guitar_clean",
  "electric_guitar_muted",
  "overdriven_guitar",
  "distortion_guitar",
  "guitar_harmonics",
  "acoustic_bass",
  "electric_bass_finger",
  "electric_bass_pick",
  "fretless_bass",
  "slap_bass_1",
  "slap_bass_2",
  "synth_bass_1",
  "synth_bass_2",
  "violin",
  "viola",
  "cello",
  "contrabass",
  "tremolo_strings",
  "pizzicato_strings",
  "orchestral_harp",
  "timpani",
  "string_ensemble_1",
  "string_ensemble_2",
  "synth_strings_1",
  "synth_strings_2",
  "choir_aahs",
  "voice_oohs",
  "synth_choir",
  "orchestra_hit",
  "trumpet",
  "trombone",
  "tuba",
  "muted_trumpet",
  "french_horn",
  "brass_section",
  "synth_brass_1",
  "synth_brass_2",
  "soprano_sax",
  "alto_sax",
  "tenor_sax",
  "baritone_sax",
  "oboe",
  "english_horn",
  "bassoon",
  "clarinet",
  "piccolo",
  "flute",
  "recorder",
  "pan_flute",
  "blown_bottle",
  "shakuhachi",
  "whistle",
  "ocarina",
  "lead_1_square",
  "lead_2_sawtooth",
  "lead_3_calliope",
  "lead_4_chiff",
  "lead_5_charang",
  "lead_6_voice",
  "lead_7_fifths",
  "lead_8_bass__lead",
  "pad_1_new_age",
  "pad_2_warm",
  "pad_3_polysynth",
  "pad_4_choir",
  "pad_5_bowed",
  "pad_6_metallic",
  "pad_7_halo",
  "pad_8_sweep",
  "fx_1_rain",
  "fx_2_soundtrack",
  "fx_3_crystal",
  "fx_4_atmosphere",
  "fx_5_brightness",
  "fx_6_goblins",
  "fx_7_echoes",
  "fx_8_scifi",
  "sitar",
  "banjo",
  "shamisen",
  "koto",
  "kalimba",
  "bagpipe",
  "fiddle",
  "shanai",
  "tinkle_bell",
  "agogo",
  "steel_drums",
  "woodblock",
  "taiko_drum",
  "melodic_tom",
  "synth_drum",
  "reverse_cymbal",
  "guitar_fret_noise",
  "breath_noise",
  "seashore",
  "bird_tweet",
  "telephone_ring",
  "helicopter",
  "applause",
  "gunshot",
];
export const std_drums = {
  0: 258, //: "Standard",
  8: 260, //: "Room",
  16: 261, //"power kit",
  24: 262, //: "Power",
  25: 263, ///: "808/909",
  32: 265, //"Dance",
  40: 266, // "Jazz",
};

export function cspawn(
  str,
  { debug }: { debug: boolean } = { debug: false }
): { stdout; stdin; stderr } {
  let t = str.split(" ");

  const { stdin, stdout, stderr } = spawn(t.shift(), t);
  if (debug) {
    stdout.on("error", (e) => console.log(e.toString(), str));
    stderr.pipe(process.stderr);
  }
  return { stdin, stdout, stderr };
}
export function WAVheader(n) {
  const buffer = Buffer.alloc(44);
  let view = new DataView(buffer.buffer);
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  /* RIFF identifier */
  writeString(view, 0, "RIFF");
  /* RIFF chunk length */
  view.setUint32(4, 36 + n * 4, true);
  /* RIFF type */
  writeString(view, 8, "WAVE");
  /* format chunk identifier */
  writeString(view, 12, "fmt ");
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 2, true);
  /* sample rate */
  view.setUint32(24, 48000, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, 48000 * 8, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2 * 4, true);
  /* bits per sample */
  view.setUint16(34, 32, true);
  /* data chunk identifier */
  writeString(view, 36, "data");
  /* data chunk length */
  view.setUint32(40, n * 4, true);

  return buffer;
}
export const keys = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export const keys88 = /*([1,2,3,4,5,6,7].map(oct=> keys.map(k=>{
  return k+oct
}).join(",")).join(",")).split(',')
*/ [
  "A0",
  "Bb0",
  "B0",
  "C1",
  "Db1",
  "D1",
  "Eb1",
  "E1",
  "F1",
  "Gb1",
  "G1",
  "Ab1",
  "A1",
  "Bb1",
  "B1",
  "C2",
  "Db2",
  "D2",
  "Eb2",
  "E2",
  "F2",
  "Gb2",
  "G2",
  "Ab2",
  "A2",
  "Bb2",
  "B2",
  "C3",
  "Db3",
  "D3",
  "Eb3",
  "E3",
  "F3",
  "Gb3",
  "G3",
  "Ab3",
  "A3",
  "Bb3",
  "B3",
  "C4",
  "Db4",
  "D4",
  "Eb4",
  "E4",
  "F4",
  "Gb4",
  "G4",
  "Ab4",
  "A4",
  "Bb4",
  "B4",
  "C5",
  "Db5",
  "D5",
  "Eb5",
  "E5",
  "F5",
  "Gb5",
  "G5",
  "Ab5",
  "A5",
  "Bb5",
  "B5",
  "C6",
  "Db6",
  "D6",
  "Eb6",
  "E6",
  "F6",
  "Gb6",
  "G6",
  "Ab6",
  "A6",
  "Bb6",
  "B6",
  "C7",
  "Db7",
  "D7",
  "Eb7",
  "E7",
  "F7",
  "Gb7",
  "G7",
  "Ab7",
  "A7",
  "Bb7",
  "B7",
];
