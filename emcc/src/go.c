void loadSample(int n, void *data, float *flts);
static int nsamples;
static unsigned short *samples;
static float *fsamples;

void loadSample(int n, void *data, float *flts)
{
	samples = (unsigned short *)data;

	for (int i = 0; i < n; i++)
	{
		*fsamples++ = *samples++ / (0.0f + 0x7fff);
	}
}
