
#define TSF_IMPLEMENTATION
#define TSF_RENDER_EFFECTSAMPLEBLOCK 1

#include "tsf.h"
#include <stdlib.h>

static tsf *g_TinySoundFont;
int main(int argc, char **argv)
{
#define TSF_RENDER_EFFECTSAMPLEBLOCK 10000

	// if (argc < 5)
	// 	return 1;
	struct tsf_envelope env;
	struct tsf_region r;
	g_TinySoundFont = tsf_load_filename("./file.sf2");
	tsf_set_output(g_TinySoundFont, TSF_STEREO_INTERLEAVED, 49000, 0);
	//struct tsf_region r = g_TinySoundFont->presets[0].regions[0];
	tsf_note_on(g_TinySoundFont, 22, 44, .44);
	float ob[49000];
	tsf_render_float(g_TinySoundFont, ob, 49000 / 2, 0);
	return 1;
}