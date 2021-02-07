
#define TSF_IMPLEMENTATION
#include "tsf.h"
#include <stdlib.h>
#include <stdio.h>
#include <sys/shm.h> // Holds the global instance pointer
static tsf *g_TinySoundFont;
static tsf *f;
int main(int argc, char **argv)
{

	f = tsf_load_filename("./FluidR3_GM.sf2");
	tsf_set_output(f, TSF_STEREO_INTERLEAVED, 48000, 0);
	struct tsf_preset* preset=tsf_get_presetindex(f,258);
	
}
