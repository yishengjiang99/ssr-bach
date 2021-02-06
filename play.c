
#define TSF_IMPLEMENTATION
#include "tsf.h"
#include <stdlib.h>
#include <stdio.h>
#include <sys/shm.h> // Holds the global instance pointer
static tsf *g_TinySoundFont;
int main(int argc, char **argv)
{

	g_TinySoundFont = tsf_load_filename("./FluidR3_GM.sf2");
	tsf_set_output(g_TinySoundFont, TSF_STEREO_INTERLEAVED, 48000, 0);
	char str[60];
	while (fread(str, 60, stdin) != NULL)
	{
		int preset, midi, velocity, duration;
		sscanf(str, "%d %d %d %d", &preset, &midi, &velocity, &duration);
		float *buff = malloc(duration * 48000 * 2 * sizeof(float));
		tsf_channel_set_presetindex(g_TinySoundFont, 0, preset);
		tsf_note_on(g_TinySoundFont, preset, midi, velocity / 128.0f);
		tsf_render_float(g_TinySoundFont, &buff, duration * 48000, 0);
		fwrite(&buff, 4, duration * 48000 * 2, stdout);
		free(buff);
	}
}
