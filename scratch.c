#include <stdio.h>
#include <stdlib.h>

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

typedef uint8_t uint8_t;
typedef uint32_t uint32_t; // uint32_t;
typedef uint32_t FOURCC;
typedef struct
{
	uint8_t lo, hi;
} rangesType; //  Four-character code

typedef union
{
	rangesType ranges;
	short shAmount;
	unsigned short uAmount;
} genAmountType;
typedef struct
{
	unsigned short operator;
	genAmountType val;
} pgen_t;
typedef struct
{
	short attentuation, lpf_cutff, lpf_q;
	float pitchAdjust;
	short a, d, s, r;
	int start, end, loopStart, loopEnd, sampleRate;
} zone;
int main()
{
	static zone defaultZone =
		{
			0, 0, 0,					 // attentuation, lpf_cutff, lpf_q;
			1.0f,						 //pitch adjust
			-11500, -11500, 300, -11500, //timecent ,timcent, centidecible,timecent
		};
	pgen_t gg[55];
	printf("%d", defaultZone.start);
	printf("%2x", gg[33].val.shAmount);
	assert(gg[33].val.shAmount == 0);
}