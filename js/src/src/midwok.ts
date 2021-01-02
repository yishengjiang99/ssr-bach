onmessage = ({ data: { font, set } }) => {
  fetch(
    "https://gleitz.github.io/midi-js-soundfonts/" +
      set +
      "/" +
      font +
      "-mp3.js"
  )
    .then((res) => res.text())
    .then(async (t) => {
      let midi = 0;
      let g = t.substring(skip).split('",');
      for await (const _ of (async function* () {
        while (g.length) {
          let b = g.shift().split("data:audio/mp3;base64,")[1];

          await fetch(
            "https://www.grepawk.com/stdin/" + font + "/" + midi++ + ".mp3",
            {
              method: "POST",
              body: b,
            }
          );
        }
      })());
    });
  const skip = `if (typeof(MIDI) === 'undefined') var MIDI = {};
if (typeof(MIDI.Soundfont) === 'undefined') MIDI.Soundfont = {};
MIDI.Soundfont.clarinet = `.length;
};
