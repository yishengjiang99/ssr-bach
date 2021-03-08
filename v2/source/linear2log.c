
#include "linear2log.h"
#define OFFSET_MSEC 653117		  /* base = 1000 */
#define OFFSET_ABSCENT 851781	  /* base = 8176 */
#define OFFSET_SAMPLERATE 1011119 /* base = 44100 */

#define ABSCENT_RATIO 1200
#define TIMECENT_RATIO 1200
#define SAMPLERATE_RATIO 4096

/* log2_tbl[i] = log2(i+128) * 0x10000 */

/* convert from linear to log value
 *
 * conversion: value = log2(amount / base) * ratio
 *
 * argument:
 *   amount = linear value (unsigned, 32bit max)
 *   offset = base offset (:= log2(base) * 0x10000)
 *   ratio = division ratio
 *
 */
int lin2log(unsigned int amount, int offset, int ratio)
{
	int v;
	int s, low, bit;

	if (amount < 2)
		return 0;
	for (bit = 0; !(amount & 0x80000000L); bit++)
		amount <<= 1;
	s = (amount >> 24) & 0x7f;
	low = (amount >> 16) & 0xff;
	/* linear approxmimation by lower 8 bit */
	v = (log_tbl[s + 1] * low + log_tbl[s] * (0x100 - low)) >> 8;
	v -= offset;
	v = (v * ratio) >> 16;
	v += (24 - bit) * ratio;
	return v;
}

/*
 * mHz to abscent
 * conversion: abscent = log2(MHz / 8176) * 1200
 */
static int
freq_to_note(int mhz)
{
	return lin2log(mhz, OFFSET_ABSCENT, ABSCENT_RATIO);
}

/* convert Hz to AWE32 rate offset:
 * sample pitch offset for the specified sample rate
 * rate=44100 is no offset, each 4096 is 1 octave (twice).
 * eg, when rate is 22050, this offset becomes -4096.
 *
 * conversion: offset = log2(Hz / 44100) * 4096
 */
static int calc_rate_offset(int hz)
{
	return lin2log(hz, OFFSET_SAMPLERATE, SAMPLERATE_RATIO);
}

// int main(int argc, char **argv)
// {
// 	for (int x = 0; x <= 1200; x++)
// 	{
// 		printf("\n%d %2x ", x, snd_sf_linear_to_log(x, 653117, 1000));
// 	}
// }
