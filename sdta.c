/**
 * 
 * sdta stands for sample data.
 *
 * takes n chars and stores it in n/4 floats
 * load(n, void* data, float*floats);
 * 
 *  
 */
#define DEaBUG 1
#ifdef DEBUG
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#endif

int load(int n, void *data, float *floats);
int render(float *output, int position, int startLoop, int endLoop, float ratio, float multiplier);

static int nsamples;
static short *bit16s;
static float *floats;

#ifdef DEBUG
int main()
{
  char ob[1024];
  int start = 2426 + 4;
  int end = 31028642;

  FILE *fd = fopen("./sf2/GeneralUserGS.sf2", "rb");
  fseek(fd, start, SEEK_SET);
  uint8_t *fob = (uint8_t *)malloc(end - start + 1);

  fread(fob, 1, start - end, fd);
  floats = (float *)malloc(sizeof(float) * (end - start));
  load(end - start, fob, floats);
  float *output = (float *)malloc(sizeof(float) * 128);
  FILE *ffp = popen("ffplay -f f32le -i pipe:0 -ac  1 -ar 48k", "w");

#define playnote(key)

  pclose(ffp);
}
#endif

int load(int n, void *data, float *floats)
{
  nsamples = n;
  bit16s = (short *)data;
  data = data + nsamples * sizeof(short);
  for (int i = 0; i < nsamples; i++)
  {
    *(floats + i) = *(bit16s + i) * 1.0f / 0xffff;
  }
  return 1;
}

int render(float *output, int position, int startLoop, int endLoop, float ratio, float multiplier)
{

  int loopr = (endLoop - startLoop);
  float shift = 0.0f;

  for (int i = 0; i < 128; i++)
  {
    *(output + i) = *(output + i) + multiplier * *(floats + position);

    shift += ratio;

    while (shift >= 1)
    {
      shift--;
      position++;
    }
    if (position >= endLoop)
    {
      position -= loopr;
    }
    // printf("\n%d", position);
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