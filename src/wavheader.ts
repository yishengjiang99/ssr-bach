var writeString = function (view, offset, str) {
  return str.split("").map(function (char, idx) {
    view.setUint8(offset + idx, char.charCodeAt(0));
  });
};
/*
	`52 49 46 46 24 08 00 00 57 41 56 45 66 6d 74 20 10 00 00 00 01 00 02 00 
22 56 00 00 88 58 01 00 04 00 10 00 64 61 74 61 00 08 00 00 00 00 00 00 
24 17 1e f3 3c 13 3c 14 16 f9 18 f9 34 e7 23 a6 3c f2 24 f2 11 ce 1a 0d`;
*/
export const wavHeader = function (
  seconds: number,
  numChannels: number = 2,
  sampleRate: number = 36000,
  bytesPerSample: number = 4
) {
  var buffer = new ArrayBuffer(48);
  var view = new DataView(buffer);
  const length = sampleRate * seconds * numChannels * bytesPerSample;
  /* RIFF identifier */
  writeString(view, 0, "RIFF");
  /* RIFF chunk length */
  view.setUint32(
    4,
    36 + sampleRate * seconds * numChannels * bytesPerSample,
    true
  );
  /* RIFF type */
  writeString(view, 8, "WAVE");
  /* format chunk identifier */
  writeString(view, 12, "fmt ");
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * 2, true);
  /* bits per sample */
  view.setUint16(34, bytesPerSample * 8, true);
  /* data chunk identifier */
  writeString(view, 36, "data");
  // /* data chunk length */
  view.setUint32(40, sampleRate * seconds * numChannels * bytesPerSample, true);
  return view.buffer;
};
