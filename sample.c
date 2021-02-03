#include <stdio.h>
#include <math.h>
#define TSF_IMPLEMENTATION
#include "tsf.h"

static tsf *g_TinySoundFont; //= tsf_load_filename("./FluidR3_GM.sf2");

void sample(int presetIndex, int midi, int durationMS, int velocity)
{

	if (!g_TinySoundFont)
		g_TinySoundFont = tsf_load_filename("./FluidR3_GM.sf2");

	float *b = (void *)malloc(2 * 48 * durationMS * 4);
	tsf_set_output(g_TinySoundFont, TSF_STEREO_INTERLEAVED, 48000, 0);
	tsf_channel_set_bank_preset(g_TinySoundFont, 0, 0, presetIndex);
	tsf_channel_note_off_all(g_TinySoundFont, 0);

	tsf_channel_note_on(g_TinySoundFont, 0, midi, velocity / 128.0f); // presetIndex, midi, velocity / 127.0f);
	tsf_render_float(g_TinySoundFont, b, durationMS * 48, 0);
	fwrite(b, 4, durationMS * 48 * 2, stdout);
}

int main(int argc, char **argv)
{
	sample(1, 22, 100, 120);
	sample(1, 44, 100, 120);
	sample(1, 33, 100, 120);
	sample(1, 22, 100, 120);
	sample(1, 45, 100, 120);
}index