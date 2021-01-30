
#define TSF_IMPLEMENTATION
#include "tsf.h"
#include <stdlib.h>
#define TML_IMPLEMENTATION
#include "tml.h"

#include <sys/shm.h> // Holds the global instance pointer
static tsf *g_TinySoundFont;
static tml_message *g_MidiMessage;
int main(int argc, char **argv)
{
		
	g_TinySoundFont = tsf_load_filename("./FluidR3_GM.sf2");


	if(argc<2){
		printf("\tindex:preset");
		for(int i=0;i<tsf_get_presetcount(g_TinySoundFont);i++){
			if(i%3==0) printf("\n");
			printf("\t%d:%s", i, tsf_get_presetname(g_TinySoundFont,i));
		}
		perror("\nUsrage: ./install [preset index ]\n\n");
		return 1;
	}
	int presetIndex = atoi(argv[1]);



	
	tsf_set_output(g_TinySoundFont, TSF_STEREO_INTERLEAVED, 48000, 0);

	int durationMS = 500;
	int velocity = 124;
	int n = durationMS * 48;
	char filename[55];

	sprintf(filename, "fast-a-%d-0-88.pcm", presetIndex);
	FILE *fd = fopen(filename, "wb+");
	float *b = malloc(n * sizeof(float) * 2);
	for (int midi=21; midi<= 109; midi++)
	{

			// tsf_channel_set_presetindex(g_TinySoundFont, 0, presetIndex);
		tsf_note_off_all(g_TinySoundFont);
		tsf_note_on(g_TinySoundFont, presetIndex, midi, velocity / 128.0f);
		tsf_render_float(g_TinySoundFont, b, n, 0);
		fwrite(b, 4, n * 2, fd);
	}
	return 1;
}