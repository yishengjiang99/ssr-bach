import { generatorNames, keys88 } from './sf.types.js';
import { std_inst_names } from './utilv1.js';

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const h = (type, attr = {}, children = []) => {
  const div = document.createElement(type);
  for (const key in attr) {
    if (key.match(/on(.*)/)) {
      div.addEventListener(key.match(/on(.*)/)[1], attr[key]);
    } else {
      div.setAttribute(key, attr[key]);
    }
  }
  if (Array.isArray(children))
    children.forEach((c) => {
      typeof c == 'string' ? (div.innerHTML += c) : div.appendChild(c);
    });
  else div.textContent = children;
  return div;
};

export async function fetchAwaitBuffer(url) {
  return await (await fetch(url)).arrayBuffer();
}

export const mlist = h(
  'main',
  { class: 'menu' },
  '10.mid,11.mid,12.mid,13.mid,14.mid,15.mid,16.mid,17.mid,18.mid,19.mid,3.mid,4.mid,5.mid,6.mid,7.mid,8.mid,9.mid,C2v5.wav,C2v5.wav.1,Michael_Jackson_-_Smooth_Criminal.mid,Michael_Jackson_-_Smooth_Criminal.mid.1,TV_Themes_-_7th_Heaven.mid,TV_Themes_-_Beverly_Hillbillys.mid,TV_Themes_-_Friends.mid,TV_Themes_-_South_Park.mid,TV_Themes_-_Step_by_Step.mid,TV_Themes_-_The_Simpsons.mid,The_Corrs_-_Leave_Me_Alone.mid,Traditional_-_Amazing_Grace.mid,Traditional_-_Five_little_Monkeys.mid,Traditional_-_Humpty_Dumpty.mid,Traditional_-_Oh_Susanna.mid,Traditional_-_Old_King_Cole.mid,Traditional_-_The_Hokey_Cokey.mid,Traditional_-_Waltzing_Matilda.mid,all_hell_billie.mid,another-day-in-paradise-1-mid.mid,bach_846-mid.mid,bach_847-mid.mid,bach_850-mid.mid,backstreet-boys-as-long-as-you-love-me-mid.mid,backstreet-boys-i-want-it-that-way-mid.mid,beethoven_symphony_5_1_(c)galimberti.mid,billie-eilish-bad-guy-midi-by-carlo-prato-www-cprato-com-mid.mid,bohemian-rhapsody-1-mid.mid,chp_op18-mid.mid,chpn_op10_e01-mid.mid,chpn_op10_e05-mid.mid,chpn_op10_e12-mid.mid,chpn_op23-mid.mid,chpn_op7_1-mid.mid,chpn_op7_2-mid.mid,hello.c,midifiles_beethoven-symphony5-1-1-mid.mid,midifiles_beethoven-symphony5-1-mid.mid,midifiles_simpsons-3-1-mid.mid,monitor.ts,mozart-piano-concerto-21-2-elvira-madigan-piano-solo-mid.mid,mz_330_1-mid.mid,mz_331_1-mid.mid,mz_331_2-mid.mid,mz_332_3-mid.mid,mz_333_1-mid.mid,mz_333_2-mid.mid,mz_333_3-mid.mid,mz_545_1-1-mid.mid,mz_545_2-mid.mid,mz_570_1-mid.mid,mz_570_2-1-mid.mid,mz_570_3-mid.mid,piano-concerto-n21-k467-1mov-elvira-madigan-mid.mid,piano-concerto-n21-k467-3mov-elvira-madigan-mid.mid,queen-bohemian-rhapsody-mid.mid,serenade_k361_3rd-mid.mid,serenade_k361_3rd-mid.mid.1,symphony_1_3_(c)lucarelli 2.mid'
    .split(',')
    .map((f) => `<li><a href='#/${f}'>${f}</a></a>`)
);

export const pdtaView = (_pdta) => {
  const div = h('pre');

  for (const presetId of [
    'acoustic_grand_piano',
    'bright_acoustic_piano',
    'electric_grand_piano',
    'honkytonk_piano',
    'marimba',
    'xylophone',
    'tubular_bells',
    'drawbar_organ',
    'percussive_organ',
    'rock_organ',
    'church_organ',
    'reed_organ',
    'accordion',
    'harmonica',
    'tango_accordion',
    'acoustic_guitar_nylon',
    'acoustic_guitar_steel',
    'electric_guitar_jazz',
    'electric_guitar_clean',

    'overdriven_guitar',
    'distortion_guitar',
    'guitar_harmonics',
    'acoustic_bass',

    'slap_bass_1',

    'synth_bass_1',
    'synth_bass_2',
    'violin',
    'viola',
    'cello',
  ].map((str) => std_inst_names.indexOf(str))) {
    const phr = _pdta.phdr
      .filter((p, idx) => presetId == p.presetId && p.bankId == 0)
      ?.shift();

    if (!phr) continue;
    const citty_css = `display:grid;grid-template-rows:1fr 4fr 1 fr;`;
    div.innerHTML += `<div style='${citty_css}'>
    <div>${phr.name}-${phr.presetId}</div>`;
    for (const speed in ['fast', 'mid', 'slow']) {
      div.innerHTML += speed;
      const vel = speed == 'fast' ? 110 : speed == 'mid' ? 77 : 43;
      const { insts } = _pdta.findPreset(phr.presetId, 0, -1, vel);
      for (const inst of insts) {
        div.innerHTML += inst.name;
        inst.izones.forEach(
          (z) =>
            (div.innerHTML += `
                <a href='sample/${z.sampleID}/'>${
              _pdta.shdr[z.sampleID]?.name
            }</a>`)
        );
      }
    }
  }

  return div;
};
