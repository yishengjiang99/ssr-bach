export const Sequencer = () => {
  const sequenceArray = new Array(224).fill(new Array(80).fill(" "));
  const beatsPerRow = 1 / 4;
  let buffers = [];
  let activeTracks = {};
  let dynamicCompression = {
    threshold: 0.8,
    ratio: 10,
    attack: 0.5,
    knee: 0.9,
  };

  return {
    showCurrentRow: () => {
      let row = sequenceArray.shift();
      process.stdout.write("\n" + row.join(""));
      row = null;
      sequenceArray.push(new Array(80).fill(" "));
    },

    addNew: (notes, ticksPerbeat) => {
      while (notes.length) {
        const note = notes.shift();

        activeTracks[note.trackId] = note;
        let i = 0;
        while (i < Math.ceil(note.durationTicks / ticksPerbeat) * 4) {
          sequenceArray[i][note.midi] = i;
          i++;
        }
      }
    },
  };
};
