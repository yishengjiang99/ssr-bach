#include <stdio.h>
#include <math.h>
#define TSF_IMPLEMENTATION
#include "tsf.h"

#include <fcntl.h>
#include <sys/mman.h>
#include <unistd.h>
static tsf *g_TinySoundFont; //= tsf_load_filename("./FluidR3_GM.sf2");

void noteOn(int presetIndex, int midi, int durationMS, int velocity)
{

	float *shptr = (float *)malloc(2 * 48 * durationMS * 4); //0, 2 * 48 * durationMS * 4, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);

	int n = durationMS * 48;
	tsf_note_on(g_TinySoundFont, presetIndex, midi, velocity / 128.0f);
}

int main(int argc, char **argv)
{
	if (!g_TinySoundFont)
		g_TinySoundFont = tsf_load_filename("/Volumes/RAM Disk/FluidR3_GM.sf2");
	char filename[254];

	tsf_set_output(g_TinySoundFont, TSF_STEREO_INTERLEAVED, 48000, 0);
	int presetIndex, midi, durationMS, velocity;
	char cmd;
	float *shptr = (float *)malloc(48000 * 3 * 2 * 4);
	int length = 0;
	while ((cmd = fgetc(stdin)) != 'q')
	{
		switch (cmd)
		{
		case 'p':
			fscanf(stdin, " %d %d %d %d", &presetIndex, &midi, &durationMS, &velocity);
			if (midi > 0 && durationMS > 0)
			{
				tsf_note_on(g_TinySoundFont, presetIndex, midi, velocity / 128.0f);
				length = durationMS > length ? durationMS : length;
			}
			midi = 0;
			break;
		case 'r':

			fscanf(stdin, " %s", filename);
			FILE *fd = fopen(filename, "a+b");
			tsf_render_float(g_TinySoundFont, shptr, length * 48, 1);
			fwrite(shptr, 4, length * 48, fd);
			tsf_note_off_all(g_TinySoundFont);
			break;
		case 'q':
			return 0;
		case 'a':
			tsf_note_on(g_TinySoundFont, 0, 61, 100 / 128.0f);
			break;
		default:
			break;
		}
	}
}
