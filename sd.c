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
	int i=0; while(i++<100000){}
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

int main()
{
	load_sf();
	float *b = (float *)malloc(1 * 48000 * 2 * sizeof(float));
	sample(b,0,44,1000,120);
	fwrite(&b, sizeof(float), 48000 * 2, fopen("here.pcm", "a+b"));
}