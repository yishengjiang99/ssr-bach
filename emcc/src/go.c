
static track_t *tracks;
void getSample(float *buf, unsigned int start, unsigned int length);
float hermite4(float frac_pos, float xm1, float x0, float x1, float x2);
int render(float *output, int n, track_t *tracks);
void loadSample(int n, void *data);
static int nsamples;
static int16_t samples;
static float *fsamples;

EMSCRIPTEN_KEEPALIVE
void loadSample(int n, void *data)
{
	nsamples = n;
	samples = (int16_t *)data;
	fsamples = (float *)malloc(sizeof(float) * nsamples);
	for (int i = 0; i < nsamples; i++)
	{
		*fsamples++ = (samples++) / (0.0f + 0x7fff);
	}
}
EMSCRIPTEN_KEEPALIVE
void getSample(float *buf, unsigned int start, unsigned int length)
{
	while (length > 0)
	{
		*buf++ = *(fsamples + start++);
		length--;
	}
}
#define frameSize 128

EMSCRIPTEN_KEEPALIVE
int render(float *output, int n, track_t *tracks)
{
	for (int i = 0; i < n; i++)
	{
		track_t *t = tracks + n;
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
				start -= (end - start);
			}
		}
		t->length -= frameSize;
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

int main()
{
}