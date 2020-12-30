// `bassoon
// clarinet
// flute
// french_horn
// oboe
// pizzicato_strings
// string_ensemble_1
// timpani
// trumpet`
//   .split("\n")
//   .map((n) => {
//     fetch(
//       "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/" + n + "-mp3.js"
//     )
//       .then((res) => res.text())
//       .then(async (t) => {
//         let midi = 0;
//         let g = t.substring(skip).split('",');
//         for await (const _ of (async function* () {
//           while (g.length) {
//             let b = g.shift().split("data:audio/mp3;base64,")[1];
//             await fetch(
//               "https://www.grepawk.com/stdin/" + n + "/" + midi++ + ".mp3",
//               {
//                 method: "POST",
//                 body: b,
//               }
//             );
//           }
//         })());
//       });
//     const skip = `if (typeof(MIDI) === 'undefined') var MIDI = {};
// if (typeof(MIDI.Soundfont) === 'undefined') MIDI.Soundfont = {};
// MIDI.Soundfont.clarinet = `.length;
//   });
