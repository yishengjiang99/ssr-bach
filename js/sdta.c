static int nsamples;
short *bit16s;
float *floats;
int load(void *data, float *floats)
{
  bit16s = (short *)data;
  data = data + nsamples * sizeof(short);
  for (int i = 0; i < nsamples; i++)
  {
    *(floats + i) = *(bit16s + i) * 1.0f / 0x8000;
  }
}
