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
const redis = require("redis");
let client = redis.createClient();
export function db_get(key: string) {
  const redis = require("redis");
  client = client || redis.createClient();

  client.on("error", function (error) {
    console.error(error);
  });
  return client.get(key).buffer;
}
export function dbset(key: string, val: any) {
  const redis = require("redis");
  client = client || redis.createClient();

  client.on("error", function (error) {
    console.error(error);
  });
  client.set(key, val);
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
