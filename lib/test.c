#include <stdio.h>
#include <stdlib.h>
#include "emu_log2.c"

/**
 * 
 *  log2 for the range of 1-2. used for the last mile calc for precision
 * 
 *  
 * 
 * */
#define plog2(x) printf("%d = %2x = %f \r\n", x, log_tbl[x + 128], log_tbl[x + 128] * 1.0f / 65535)

void normalize(int x)
{
	int bit, s, low;
	int ox = x;
	for (bit = 0; !(x & 0x80000000L); bit++)
	{
		x = x << 1;
	}
	s = (x >> 24) & 0x7f;
	low = (x >> 16) & 0xff;
	int v = (log_tbl[s + 1] * low + log_tbl[s] * (0x100 - low)) >> 8;
	int vv = v >> 16;
	int ff = vv + (24 - bit);
	printf("\ninput:%d \tbitshift:%d \tlow:%x \t sig: %x \tlog sig: %f\t=%d %d %f\r\n",
		   ox, bit, (0x100 - low) >> 7, s, log_tbl[s + 1], vv, ff, (ff + 0.0f) / 32767.0f);

	//	printf("\n%d,%d,==>%x %x", s, low, (log_tbl[s + 1] * low) >> 8, (log_tbl[s] * (0x100 - low) >> 8));

	//printf("\n%d,%d,==>%x %x", s, low, (log_tbl[s + 1] * low) >> 8, (log_tbl[s] * (0x100 - low) >> 8));
}

int main()
{
	plog2(-120);
	plog2(-128);
	for (int i = 1; i < 1111; i++)
	{
		normalize(i + 43);
	}
	// 	 value = log2(amount / base) * ratio
	// 2^(value/ratio) = amount/base
	// base 44100
	// 44100* 2^(value))= amount*2

	// 	  *   amount = linear value (unsigned, 32bit max)
	//  *   offset = base offset (:= log2(base) * 0x10000)
	//  *   ratio = division ratio

	/**
	 * 
	 * convert Hz to AWE32 rate offset:
 * sample pitch offset for the specified sample rate
 * rate=44100 is no offset, each 4096 is 1 octave (twice).
 * eg, when rate is 22050, this offset becomes -4096.
 *
 * conversion: offset = log2(Hz / 44100) * 4096
 * 
 *	sample offset:
 * HZ 44100: ratio:1
 * 22050: ratio 1/2
 * offset: 4096
 * 
 * log2(44)
*/
}