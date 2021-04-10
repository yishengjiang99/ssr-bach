void rend(float *in, float *out, int offset, int reset);

void rend(float *in, float *out, int offset, int reset)
{
	//
	for (int i = 0; i < 128; i++)
	{
		if (reset)
			out[i] = 0;

		out[i] = out[i] + in[offset++];
	}
}