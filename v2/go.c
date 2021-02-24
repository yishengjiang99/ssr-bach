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
void init(int16_t *input, int n)
{
    data = (float *)malloc(n * 4);
    for (int i = 0; i < n - 2; i++)
    {
        data[i] = input[i] / 32767.0f;
        //	printf("\n%d, %d %f", n, i, *(data + i));
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
            ptr->length -= size;
        }
    }
    // for (int i = 0; i < size; i++)
    // {
    // //	printf("\n%f", *(output + i));
    // }
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
            *output += t->lastOutput;
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

int test()
{
    FILE *output;
    int size = 31026308;
    int start = 2426;
    FILE *fd = fopen("./file.sf2", "r+b");

    int16_t *ptr = (int16_t *)malloc(size);
    fseek(fd, start, SEEK_CUR);
    fread(ptr, size / 2, 2, fd);
    init(ptr, size / 2);

    noteOn(6586882, 6650289, 6619732, 6650288, 48000, 0, 2);
    noteOn(6586882, 6650289, 6619732, 6650288, 48000, 1, 4);
    output = popen("ffplay -i output.pcm -ac 1 -ar 30000 -f f32le", "w");

    float *ff = (float *)malloc(128 * sizeof(float));
    for (int i = 0; i < 48000; i += 128)
    {
        render(ff, 128);
        fwrite(ff, sizeof(float), 128, output);
    }
}