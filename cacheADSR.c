
#define TSF_IMPLEMENTATION
#include "tsf.h"
#include <stdlib.h>

static tsf *g_TinySoundFont;
int main(int argc, char **argv)
{

	// if (argc < 5)
	// 	return 1;
	struct tsf_envelope env;
	struct tsf_region r;
	g_TinySoundFont = tsf_load_filename("./FluidR3_GM.sf2");
	FILE *adsr = fopen("./adsr.csv", "r");
	tsf_set_output(g_TinySoundFont, TSF_STEREO_INTERLEAVED, 48000, 0);
	for (int i = 0; i < 127; i++)
	{
		for (int j = 0; j < g_TinySoundFont->presets[i].regionNum; j++)
		{
			r = g_TinySoundFont->presets[i].regions[j];
			env = r.ampenv;

			fprintf(adsr, "\n%d, [%d, %d], [%d,%d], [%f, %f, %f,%f, %f]", i, r.lokey, r.hikey, r.lovel, r.hivel, env.attack, env.hold, env.decay, env.sustain, env.release); //, keynumToHold, keynumToDecay)

			//	printf("\n%d_5: [%f, %f, %f, %f]", i, env.attack, env.hold, env.decay, env.sustain, env.release); //, keynumToHold, keynumToDecay)
		}
	}

	FILE *bitma = fopen("./bitmap.csv", "w");
	for (int i = 0; i < 127; i++)
	{
		for (int j = 0; j < g_TinySoundFont->presets[i].regionNum; j++)
		{
			r = g_TinySoundFont->presets[i].regions[j];
			env = r.ampenv;

			fprintf(bitma, "\n%d, %d, %d, %d,%d, %d, %d, %d, %d,%d", i, r.lokey, r.hikey, r.lovel, r.hivel, r.offset, r.end, r.loop_start, r.loop_end, r.pitch_keycenter); //, keynumToHold, keynumToDecay)

			//	printf("\n%d_5: [%f, %f, %f, %f]", i, env.attack, env.hold, env.decay, env.sustain, env.release); //, keynumToHold, keynumToDecay)
		}
	}
}
