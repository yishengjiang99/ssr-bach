#include <emscripten.h>
#include <stdio.h>
#include <stdlib.h>
typedef struct track
{
	uint16_t length;

	uint32_t offset, end, startLoop, endLoop;
	float ratio;
} track_t;

static float *fsamples;

float hermite4(float frac_pos, float xm1, float x0, float x1, float x2);
int render(float *output, track_t *tracks);
void initWithPreload();

EMSCRIPTEN_KEEPALIVE
void initWithPreload()
{
	char name[4];
	int size, nsamples;
	int16_t *samples;
	FILE *fd = fopen("./file.sf2", "r");

	fseek(fd, 2418, SEEK_SET);
	fread(&size, 4, 1, fd);
	fread(name, 4, 1, fd);
	fread(name, 4, 1, fd);

	fprintf(stdout, "%.4s %u", name, size);

	nsamples = size / 2;
	samples = (int16_t *)malloc(sizeof(int16_t) * nsamples);
	fsamples = (float *)malloc(sizeof(float) * nsamples);
	float *ptr = fsamples;
	fread(samples, sizeof(int16_t), nsamples, fd);
	for (int i = 0; i < nsamples; i++)
	{
		*ptr++ = (*samples++) / (0.0f + 0x7fff);
	}
	printf("%lu", ftell(fd));
}

#define frameSize 128
#define polyphony 16
EMSCRIPTEN_KEEPALIVE
int render(float *output, track_t *tracks)
{
	track_t *endTrack = tracks + polyphony - 1;
	for (track_t *t = tracks; t >= endTrack; t++)
	{
		if (!t->length)
			continue;

		unsigned int start = t->startLoop;
		unsigned int end = t->endLoop;
		unsigned int offset = t->offset;
		float ratio = t->ratio;
		float shift = 0.0f;
		for (int i = 0; i < frameSize; i++)
		{
			*(output + i) = *(output + i) + *(fsamples + offset);
			output++;
			shift += ratio;
			while (shift >= 1)
			{
				offset++;
				shift--;
			}
			if (offset >= end)
			{
				start -= (end - start + 1);
			}
		}
		t->length--;
	}
	return 0;
}

float hermite4(float frac_pos, float xm1, float x0, float x1, float x2)
{
	const float c = (x1 - xm1) * 0.5f;
	const float v = x0 - x1;
	const float w = c + v;
	const float a = w + v + (x2 - x0) * 0.5f;
	const float b_neg = w + a;

	return ((((a * frac_pos) - b_neg) * frac_pos + c) * frac_pos + x0);
}
