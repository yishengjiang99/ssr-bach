#include <stdio.h>
#include <stdlib.h>
#include "lerp.c"
float *ff1, *ff2, *res;
char *cmd;
FILE *output, *fm;
#define sine(freq, n, ff)                                                                 \
	ff = malloc(n * sizeof(float));                                                         \
	char cmd[1024];                                                                         \
	sprintf(cmd, "ffmpeg -loglevel error -f lavfi -i sine=%d:duration=1 -f f32le -", freq); \
	fm = popen(cmd, "r");                                                                   \
	fread(ff, sizeof(float), n, fm);                                                        \
	pclose(fm);

#define png(res)                                                                                                 \
	output = popen("ffmpeg -y -f f32le -i pipe:0 -filter_complex showwavespic=s=400x400 -frames:v 1 ff.png", "w"); \
	fwrite(res, sizeof(float), n, output);                                                                         \
	pclose(output);

#define hear(ff, n)                                               \
	output = popen("ffplay -f f32le -ac 1 -ar 48k -i pipe:0", "w"); \
	fwrite(res, sizeof(float), n, output);                          \
	pclose(output);

shiftr *newShift()
{
	shiftr *s = (shiftr *)malloc(sizeof(shiftr));
	*s = (shiftr){.loopStart = 4, .loopEnd = 48000 - 4, .pitchshift = 1};
	return s;
}
int main()
{
	int n = 48000;

	sine(220, n, ff1);
	// sine(440, n, ff2);
	res = malloc(n * sizeof(float));

	shiftr *s = newShift();
	s->pitchshift = 4 / 3;

	output = popen("base64", "w");
	autotune(ff1, res, s, 48000);
	fwrite(res, sizeof(float), n, output);
	s->pitchshift = 8 / 3;
	autotune(ff1, res, s, 48000);
	fwrite(res, sizeof(float), n, output);
	s->pitchshift = 12 / 3;
	autotune(ff1, res, s, 48000);
	fwrite(res, sizeof(float), n, output);
	pclose(output);
}