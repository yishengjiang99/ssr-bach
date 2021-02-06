
#include "sample.h"

#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>

static tsf *g_TinySoundFont;
// ssize_t write(int fd, const void *buf, size_t count);
struct track_t
{
	float *buffer;
	int n;
	int sample_rate;
	int channel;
};
static struct track_t tracks[16];

struct track_t ssample(int preset, int midi, int vel, int n, int channel);
int loop();

void init()
{
	// if (argc < 5)
	// 	return 1;
	g_TinySoundFont = tsf_load_filename("./file.sf2");
}
int loop(int blocksize)
{
	int todo = blocksize;

	while (todo--)
	{
		double sum = 0;
		for (int t = 0; t < 16; t++)
		{
			if (tracks[t] && tracks[t].buffer != NULL)
			{
				sum += *(tracks[t].buffer++);
				if (tracks[t].n-- <= 0)
				{
					free(tracks[t]);
				}
			}
		}
	}

	return g_TinySoundFont != NULL ? g_TinySoundFont->voiceNum : -1;
}
struct track_t ssample(int preset, int midi, int vel, int n, int channel)
{
	if (!g_TinySoundFont)
		g_TinySoundFont = tsf_load_filename("./file.sf2");

	struct tsf_preset p = g_TinySoundFont->presets[preset];
	struct track_t track;

	for (int j = 0; j < p.regionNum; j++)
	{
		struct tsf_region r = p.regions[j];

		if (r.lokey <= midi && r.hikey >= midi && r.lovel <= vel && r.hivel >= vel)
		{
			track.buffer = (float *)malloc(n * sizeof(float));

			track.n = n;
			track.sample_rate = r.sample_rate;
			track.channel = channel;
			double endp = r.end;
			int scale[1000];
			int *pitchtable = lookup_pitchtable(midi, r.pitch_keycenter);

			float *input = &(g_TinySoundFont->fontSamples[r.offset]);
			int pos = r.offset;
			for (int i = 0; i < n - 1; i++)
			{
				*(track.buffer++) = input[pitchtable[i++ % 1000]];
			}
			return track;
		}
	}
	return track;
}
int main(int argc, char **argv)
{
	char *filename;
	char cmd;
	int presetIndex, n, midi, durationMS, velocity, channel;
	float *buffer;
	char line[60];

	FILE *inputf = fopen("input.txt", "r");
	init();
	while (fgets(line, 60, inputf) != NULL)

	{

		switch (line[0])
		{
		case 's':
			sscanf(line, "s %d %d %d %d %d \n", &presetIndex, &midi, &durationMS, &velocity, &channel);
			struct track_t t = ssample(presetIndex, midi, velocity, durationMS * 48, channel);
			tracks[t.channel] = t;
			break;
		case 't':

			break;
		case 'r':

			break;
		case 'q':
			return 0;
		default:
			break;
		}
	}

	return 0;
}

static int *lookup_pitchtable(int target, int originpitch)
{

	if (target - originpitch <= 3 && originpitch - target <= 3)
		return pitchtables[target - originpitch + 3];
	else
	{
		float difff = powf(2, target - originpitch);
		static int table[1000];
		for (int i = 0, pos = 0; i < 1000; i++, pos += difff)
		{
			table[i] = ~~pos;
		}
		return table;
	}
}