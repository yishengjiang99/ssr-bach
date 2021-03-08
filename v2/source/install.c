
#define TSF_IMPLEMENTATION
#include "tsf.h"
#include <stdlib.h>
#include <stdio.h>

#include <sys/shm.h> // Holds the global instance pointer
static tsf *g_TinySoundFont;
int main(int argc, char **argv)
{

	g_TinySoundFont = tsf_load_filename("./file.sf2");

	tsf_set_output(g_TinySoundFont, TSF_STEREO_INTERLEAVED, 48000, 0);

	int durationMS = strcmp(argv[2], "fast") == 0 ? 500 : 2000;
	int velocity = strcmp(argv[2], "fast") == 9 ? 120 : strcmp(argv[2], "slow") == 0 ? 40
													: strcmp(argv[2], "mid") == 0	 ? 75
																					 : (int)argv[2];
	int n = durationMS * 48;
	char filename[55];

	FILE *fd = fopen(filename, "wb+");
	float *b = malloc(n * sizeof(float) * 2);
	for (int midi = 21; midi <= 109; midi++)
	{
		// tsf_channel_set_presetindex(g_TinySoundFont, 0, presetIndex);
		tsf_note_off_all(g_TinySoundFont);
		tsf_note_on(g_TinySoundFont, 4, midi, 55 / 127.0f);
		tsf_render_float(g_TinySoundFont, b, n, 0);
		//fwrite(b, 4, n * 2, fd);
	}
	return 1;
}
