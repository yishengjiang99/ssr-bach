#include <emscripten/emscripten.h>

#include <stdio.h>
#include <stdlib.h>
#define polyphony 16

typedef struct track
{
    int start, end, startLoop, endLoop, length;
    int channelId;
    float ratio;
    float lastOutput;
} track_t;

static float *data;
static track_t *tracks;
static int nTracks;

float hermite4(float frac_pos, float xm1, float x0, float x1, float x2);
void render(float *output, int size);
void _render(float *output, int size, track_t *t);

EMSCRIPTEN_KEEPALIVE
void init(void *input, int n)
{
    data = (float *)malloc(n * sizeof(float));
    uint16_t *shorts = (uint16_t *)(&input);

    for (int i = 0; i < n; i++)
    {
        *(data + i) = *(shorts++) / 0x7fff * 1.0f;
    }
    tracks = (track_t *)malloc(sizeof(track_t) * polyphony);
}

EMSCRIPTEN_KEEPALIVE
void noteOn(int start, int end, int loopStart, int loopEnd, int length, int channelId, float ratio)
{
    track_t *tt = (tracks + channelId);

    tt->start = start;
    tt->end = end;
    tt->startLoop = loopStart;
    tt->endLoop = loopEnd;
    tt->length = length;
    tt->channelId = channelId;
    tt->ratio = ratio;
}
EMSCRIPTEN_KEEPALIVE
void render(float *output, int size)
{
    for (int i = 0; i < size; i++)
    {
        *(output + i) = -0.00000001f * (i % 5 - 5);
    }
    for (track_t *ptr = tracks; ptr != tracks + 16; ptr++)
    {
        if (ptr->length > 0)
        {
            _render(output, size, ptr);
        }
    }
}
EMSCRIPTEN_KEEPALIVE
void _render(float *output, int size, track_t *t)
{

    int loopr = (t->endLoop - t->endLoop);
    int iterator = t->start; //.offset;

    int pos = 0;
    float shift = 0.0f;
    for (int i = 0; i < size; i++)
    {

        if (i == 0)
        {
            *(output + i) += t->lastOutput;
        }
        else if (i == size - 1)
        {
            t->lastOutput = hermite4(shift, data[iterator - 1], data[iterator], data[iterator + 1], data[iterator + 2]);
        }
        else
        {
            *(output + i) += hermite4(shift, data[iterator - 1], data[iterator], data[iterator + 1], data[iterator + 2]); //lerp(g_tsf->fontSamples[iterator], g_tsf->fontSamples[iterator+1], shift);
        }

        //below few lines is sto avoid adding by floats
        shift += t->ratio;

        while (shift >= 1)
        {
            shift--;
            iterator++;
        }
        if (iterator >= t->endLoop)
        {
            iterator -= loopr;
        }
    }
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