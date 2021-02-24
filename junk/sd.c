#define TSF_IMPLEMENTATION
#include "tsf.h"
#include "unistd.h"
static tsf *g_TinySoundFont; //= tsf_load_filename("./FluidR3_GM.sf2");

struct tsf *load_sf()
{
	g_TinySoundFont = tsf_load_filename("./file.sf2");
	return g_TinySoundFont;
}
void sample(float *floatPtr, int presetIndex, int midi, int durationMS, int velocity)
{
	load_sf();

	tsf_set_output(g_TinySoundFont, TSF_STEREO_INTERLEAVED, 48000, 1.2);
	tsf_channel_note_off_all(g_TinySoundFont, 0);

	tsf_note_on(g_TinySoundFont, presetIndex, midi, velocity / 128.0f); // presetIndex, midi, velocity / 127.0f);
	tsf_render_float(g_TinySoundFont, floatPtr, durationMS * 48, 0);
}
void drumSample(float * floatPtr, int instrumentId, int midi, int durationMS, int velocity)
{


	float *b = (float *)floatPtr;
	tsf_set_output(g_TinySoundFont, TSF_STEREO_INTERLEAVED, 48000, 0);
	tsf_channel_set_bank_preset(g_TinySoundFont, 9, instrumentId, instrumentId);
	tsf_channel_note_off_all(g_TinySoundFont, 9);

	tsf_channel_note_on(g_TinySoundFont, 9, midi, velocity / 128.0f); // presetIndex, midi, velocity / 127.0f);
	tsf_render_float(g_TinySoundFont, b, durationMS * 48, 0);
}

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
	1.887748625363387};

unsigned int ssample(float *ptr, int preset, int midi, int vel, int n);
float poww(int n, int b);
float lerp(float v0, float v1, float t);


unsigned int ssample(float *ptr, int preset, int midi, int vel, int n)
{

	int pos;

	struct tsf_region r;
	struct tsf_preset p = g_TinySoundFont->presets[preset];
	for (int j = 0; j < p.regionNum; j++)
	{
		r = p.regions[j];
		if (r.lokey <= midi && r.hikey >= midi && r.lovel <= vel && r.hivel >= vel)
		{

			double shift = poww(2, (midi - r.pitch_keycenter)); //) * 48000 / r.sample_rate;

			double iterator = pos;
			int loopr = (r.loop_end - r.loop_start);

			while (n--)
			{
				printf("\n %f ",iterator);
				int pos = (int)iterator;
				*ptr++ = g_TinySoundFont->fontSamples[pos];
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
		return 2 * poww(2, n/2);

	return pow2over2table[n & 0x0c];
}

inline double fast_exp2(const double val)
{
	int e;
	double ret;

	if (val >= 0)
	{
		e = int(val);
		ret = val - (e - 1);
		((*(1 + (int *)&ret)) &= ~(2047 << 20)) += (e + 1023) << 20;
	}
	else
	{
		e = int(val + 1023);
		ret = val - (e - 1024);
		((*(1 + (int *)&ret)) &= ~(2047 << 20)) += e << 20;
	}
	return (ret);
}