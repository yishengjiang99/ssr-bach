
#define TSF_IMPLEMENTATION
#include "tsf.h"
#include <stdlib.h>
#include <sys/shm.h>

static tsf *g_TinySoundFont;
int main(int argc, char **argv)
{

	int n =500*48;
	g_TinySoundFont = tsf_load_filename("./FluidR3_GM.sf2");
	tsf_set_output(g_TinySoundFont, TSF_STEREO_INTERLEAVED, 48000, 0);
	float *output = malloc(n * sizeof(float) * 2);
	char ffname[50];
	fgets
	for (int i =80; i <127; i++)
	{
		const char *sfname = tsf_get_presetname(g_TinySoundFont, i);
		tsf_channel_set_presetindex(g_TinySoundFont, 0,  i);

		int t = 0;
		tsf_channel_set_presetindex(g_TinySoundFont, 0, i);
		tsf_note_off_all(g_TinySoundFont);
		tsf_note_on(g_TinySoundFont, i, 40, 0.75f);
		sprintf(ffname, "./midisf-%d-stereo-40.pcm", i);
		FILE *fd = fopen(ffname, "wb");
		while(t<48000){
			tsf_render_float(g_TinySoundFont, output, n, 0);
			fwrite(output, 4, n * 2, fd);
			t+=n;
		}//	fclose(fd);
		break;
	}
//	free(&buffer);
	tsf_close(g_TinySoundFont);
	
	return 0;
}