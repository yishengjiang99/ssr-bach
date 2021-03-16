mergeInto(LibraryManager.library, {
  upload: function (n, ptr) {
    let offset = ptr;
    const [lokey, hikey, lovel, hivel] = HEAPU8.subarray(offset, offset + 4);
    offset += 4;
    const [attentuation, lpf_cutff, lpf_q] = HEAP16.subarray(
      offset >> 1,
      offset + 14
    );
    offset += 14;

    const [pitchAdjust] = HEAPF32.subarray(offset >> 2, 4);
    offset += 4;
    const [start, end, loopStart, loopEnd, sampleRate] = HEAPU32.subarray(
      offset >> 2,
      20
    );

    noteload({
      lokey,
      hikey,
      lovel,
      hivel,
      attentuation,
      lpf_cutff,
      lpf_q,
      start,
      end,
      loopStart,
      loopEnd,
      sampleRate,
    });
  },
});
/**
 * typedef struct
{
	uint8_t lokey, hikey, lovel, hivel;
	short attentuation, lpf_cutff, lpf_q;
	short a, d, s, r;
  	float pitchAdjust;

	int start, end, loopStart, loopEnd, sampleRate;
} zone;
 */
