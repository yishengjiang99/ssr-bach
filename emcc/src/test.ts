const fs = require('fs');
const { SoundFont2 } = require('soundfont2');
// Get Piano.SF2 as binary buffer
const buffer = fs.readFileSync('./file.sf2');

try {
  const soundFont = SoundFont2.from(buffer);
  soundFont.banks[0].presets[0].zones
    .filter((z: any) => z.keyRange.lo > 55)[0]
    .instrument.zones.map((z: any) => {
      console.log(z.sample.header);
    });
  // Do something with the SoundFont
} catch (error) {
  console.log('Failed to load the SoundFont', error);
}
