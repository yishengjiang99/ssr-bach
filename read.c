
#define TSF_IMPLEMENTATION
#define TSF_NO_STDIO
#include "tsf.h"

static tsf *g_TinySoundFont;

float* ssample(int preset, int midi, int vel,unsigned int n);
 float poww(int n, int b);
 

struct tsf *load_sf(void*ptr, int length)
{
	g_TinySoundFont = tsf_load_memory(ptr, length);
	return g_TinySoundFont;
}

int sanecheck()
{
	return g_TinySoundFont != NULL ? g_TinySoundFont->voiceNum : -1;
}

float* ssample(int preset, int midi, int vel,unsigned int n)
{
	// if (!g_TinySoundFont)
	// 	g_TinySoundFont = tsf_load_filename("./file.sf2");

	tsf_get_presetindex(g_TinySoundFont, 0, preset);
	float *b = (float *)malloc(n * sizeof(float));
	float *head=b;
	struct tsf_region r;
	struct tsf_preset p = g_TinySoundFont->presets[preset];
	for (int j = 0; j < p.regionNum; j++)
	{
		r = p.regions[j];

		if (r.lokey <= midi && r.hikey >= midi && r.lovel <= vel && r.hivel >= vel)
		{
			unsigned int pos = r.offset;
			for (unsigned int i = 0; i < n; i++)
			{
				*(b++) =  g_TinySoundFont->fontSamples[pos++];
				
				if(pos >= r.end) {
					pos = r.loop_start;
				}

			}

		}
	}
	//printf("nothing found");
	return b;
}

// int main()
// {
// 		g_TinySoundFont = tsf_load_memory(ptr, length);

// 	g_TinySoundFont = tsf_load_filename("./file.sf2");

// 	int sr;
// 	unsigned int n = 31000;
// 	ffplay = popen("ffplay -i pipe:0 -f f32le -ac 1 -ar 31000", "w");
// 	void *b = (void *)malloc(n * sizeof(float));
// 	sr=ssample(0, 4, 34, b, n);
// 	// for(int midi = 34; midi<64; midi++){
// 	// 	ssample(0, midi, 120-midi, b, n);
// 	// 	fwrite(b, n, sizeof(float), ffplay);
	
// 	// }
// 	return 0;
// }

  float poww(int n, int b)  {
    if (b < 0) {
      return 1 / poww(n, -1 * b);
    } else if (n == 2 && b > 0.083 && b < 0.08333) {
      return 1.05946309f;
    } else if (n == 2 && b > 0.16 && b < 0.1666) {
      return 1.122462048f;
    } else if (n == 2 && b == 0.25) {
      // && b<0.17){
      return 1.1892071f;
    } else {
      return powf(n, b);
    }
  };