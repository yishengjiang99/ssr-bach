
#define TSF_IMPLEMENTATION
#define TSF_NO_STDIO
#include "tsf.h"
#include <stdint.h>

static tsf *f;

	
static uint8_t *srcPtr;
static float pow2over2table[12] = {
	1,
	1.0594630943592953,
	1.122462048309373,
	1.189207115002721,
	1.2599210498948732,
	1.3348398541700344,
	1.4983070768766815,
	1.5874010519681994,
	1.6817928305074292,
	1.7817974362806788,
	1.887748625363387
	};

unsigned int ssample(float *ptr, int preset, int midi, int vel, int n);
float poww(int n, int b);
float lerp(float v0, float v1, float t);
	
struct tsf *load_sf(uint8_t *ptr, int length)
{
	f = tsf_load_memory(ptr, length);
	srcPtr = ptr;
	return f;
}

unsigned int ssample(float *ptr, int preset, int midi, int vel, int n)
{

	int pos;

	struct tsf_region r;
	struct tsf_preset p = f->presets[preset];
	for (int j = 0; j < p.regionNum; j++)
	{
		r = p.regions[j];
		if (r.lokey <= midi && r.hikey >= midi && r.lovel <= vel && r.hivel >= vel)
		{

			double shift = poww(2, (midi - r.pitch_keycenter) / 12.0) * 48000 / r.sample_rate;

			double iterator = pos;
			int loopr = (r.loop_end - r.loop_start);

			while (n--)
			{
				int p = (int)iterator;
				*ptr++ = lerp(f->fontSamples[p], f->fontSamples[p + 1], iterator - p);
				iterator += 2 * shift;
				if (iterator > r.loop_end + 1)
					iterator -= loopr;
			}
		}
	}
	return 0;
}
float lerp(float v0, float v1, float t)
{
	return v0 + t * (v1 - v0);
}
float poww(int base, int n)
{ //int b){
	if (base != 2)
		return powf(base, n);
	if (n < 0)
		return 1 / poww(2, -1 * n);
	if (n >= 12)
		return 2 * poww(2, n - 12);
	return pow2over2table[n];
}
 
 