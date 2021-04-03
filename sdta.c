/**
 * 
 * sdta stands for sample data.
 *
 * takes n chars and stores it in n/4 floats
 * load(n, void* data, float*floats);
 * 
 *  
 */
typedef struct
{
  unsigned int position, startLoop, endLoop, blocklength;
  float ratio, gainL, gainR;

} renderParams;
#ifndef debug
void consolelog(char *str, int n)
{ /* dev null */
}
#else
extern void
consolelog(char *str, int n);
#endif
int load(void *data, float *floats, int n);
int render(float *output, renderParams *params);
float hermite4(float frac_pos, float xm1, float x0, float x1, float x2);
static int nsamples;
static short *bit16s;
static float *floats;

int load(void *data, float *floats, int n)
{
  nsamples = n;
  bit16s = (short *)data;
  data = data + nsamples * sizeof(short);
  for (int g = 0; g < nsamples; g++)
  {
    floats[g] = bit16s[g] / 65535.0f;
  }
  return 1;
}

int render(float *output, renderParams *params)
{

  int loopr = (params->endLoop - params->startLoop);
  float shift = 0.0f;
  int position = params->position;
  int blocklength = params->blocklength;

  for (int i = 0; i < blocklength - 1; i++)
  {
    output[i] = 0;
    float mono = hermite4(shift, *(floats + position - 1), *(floats + position), *(floats + position + 1), *(floats + position + 2));

    output[2 * i] = params->gainL * floats[position];
    output[2 * i + 1] = params->gainL * floats[position]; //floats[position];

    shift += params->ratio;

    while (shift >= 1)
    {
      shift--;
      position++;
    }
    while (position >= params->endLoop)
    {
      position -= loopr;
    }
  }
  return position;
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