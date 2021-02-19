#define N_MECC 1

#ifndef N_EMCC
#endif
#include <math.h>
#define TSF_IMPLEMENTATION
#include "tsf.h"
#include <assert.h>
#ifdef N_MECC
#define EMSCRIPTEN_KEEPALIVE /*ignore*/
#include <unistd.h>
#include <signal.h>
#include <time.h>
#endif
static float pow2over2table[12] = {
    1,
    1.0594630943592953,
    1.122462048309373,
    1.189207115002721,
    1.2599210498948732,
    1.3348398541700344,
    1.4142135623730951,
    1.4983070768766815,
    1.5874010519681994,
    1.6817928305074292,
    1.7817974362806788,
    1.887748625363387};
EMSCRIPTEN_KEEPALIVE
float ratioc(int rdiff)
{
    float ratio = 1;
    while (rdiff > 12)
    {
        ratio *= 2;
        rdiff -= 12;
    }
    while (rdiff < -12)
    {
        ratio /= 12;
        rdiff += 12;
    }

    ratio = rdiff >= 0 ? ratio * pow2over2table[rdiff] : ratio / pow2over2table[-1 * rdiff];
    return ratio;
}
float hermite4(float frac_pos, float xm1, float x0, float x1, float x2);

EMSCRIPTEN_KEEPALIVE
static tsf *g_tsf;
static FILE *ffp;

EMSCRIPTEN_KEEPALIVE
void init_tsf()
{
    g_tsf = tsf_load_filename("./file.sf2");
    if (!g_tsf)
    {
        perror("gtsf not loaded");
    }
}
EMSCRIPTEN_KEEPALIVE
uint8_t *stackbuff(int len)
{
    return malloc(len);
}
EMSCRIPTEN_KEEPALIVE
void read_sf(void *buffer, int size)
{
    g_tsf = tsf_load_memory(buffer, size);
    if (!g_tsf)
    {
        perror("gtsf not loaded");
    }
}

EMSCRIPTEN_KEEPALIVE
float lerp(float v0, float v1, float t)
{
    return v0 + t * (v1 - v0);
}
EMSCRIPTEN_KEEPALIVE
void load_sound(float *buffout, int presetId, int midi, int velocity, int size)
{

    int rdiff = 128; /*scalar*/ /* integer difference between sample note and note we are trying to produce*/
    struct tsf_region r;        /* the preset region we render from*/
    struct tsf_preset p;
    p = g_tsf->presets[presetId];
    for (int j = 0; j < p.regionNum; j++)
    {
        if (abs(p.regions[j].pitch_keycenter - midi) > 10)
            continue;

        if (p.regions[j].hikey < midi)
            continue;
        if (p.regions[j].lovel > velocity)
            continue;
        if (p.regions[j].hivel < velocity)
            continue;

        if (abs(midi - p.regions[j].pitch_keycenter) < rdiff)
        {

            printf("\n*** note: %d ***\npitch center:%d\nspeed lo:%d \nhi %d\nsample rate: %d\n",
                   midi, p.regions[j].pitch_keycenter, (int)(p.regions[j].lovel), (int)(p.regions[j].hivel), p.regions[j].sample_rate);

            r = p.regions[j];
            printf("r %u %u %u", r.offset, r.loop_start, r.loop_mode);
            rdiff = abs(midi - r.pitch_keycenter);
        }
    }
    if (rdiff == 128)
        return;

    int loopr = (r.loop_end - r.loop_start + 1);
    int iterator = r.offset;
    double gain = -10 - r.attenuation - tsf_gainToDecibels(1.0f / velocity);
    // *buffout++ = 1;
    // *buffout++ = r.sample_rate;
    // *buffout++ = r.ampenv.attack;
    // *buffout++ = r.ampenv.hold;
    // *buffout++ = r.ampenv.decay;
    // *buffout++ = r.ampenv.sustain;
    // *buffout++ = r.ampenv.release;
    // *buffout++ = r.initialFilterFc;
    // *buffout++ = r.initialFilterQ;

    int pos = 0;
    float shift = 0;
    float ratio = ratioc(midi - r.pitch_keycenter);
    fprintf(stdout, "\nplayback ratio %f gain %f \n**** </%d> *** %u \n", ratio, gain, midi, size);

    for (int i = 0; i < size; i++)
    {
        if (i == 0)
            *buffout++ = 0;
        else
            *buffout++ = hermite4(shift, g_tsf->fontSamples[iterator - 1], g_tsf->fontSamples[iterator], g_tsf->fontSamples[iterator + 1], g_tsf->fontSamples[iterator + 2]); //lerp(g_tsf->fontSamples[iterator], g_tsf->fontSamples[iterator+1], shift);

        shift += ratio;

        while (shift >= 1)
        {
            shift--;
            iterator++;
        }
        if (iterator >= r.loop_end)
        {
            printf("loop %u", iterator);

            iterator -= loopr;
            printf("loop %u \n", iterator);
        }

        //break;
    }
}
//https://www.musicdsp.org/en/latest/Other/93-hermite-interpollation.html
EMSCRIPTEN_KEEPALIVE
float hermite4(float frac_pos, float xm1, float x0, float x1, float x2)
{
    const float c = (x1 - xm1) * 0.5f;
    const float v = x0 - x1;
    const float w = c + v;
    const float a = w + v + (x2 - x0) * 0.5f;
    const float b_neg = w + a;

    return ((((a * frac_pos) - b_neg) * frac_pos + c) * frac_pos + x0);
}

#ifdef N_MECC

volatile sig_atomic_t flag = 0;
void my_function(int _sig)
{ // can be called asynchronously
    char bytes[15];
    int sig = _sig - 11;
    if (sig == 16)
    {
        int info[3];
        int i = 0;
        while (i < 3)
        {
            info[i++] = flag & 0xff;

            flag = flag >> 8;
        }
        fprintf(stderr, "\n %2x %2x %2x", info[0], info[1], info[2] ); //, (info[2] << 4) | info[3], (info[4] << 4) | info[5]);
        float buf[25000];
        load_sound(buf, info[0], info[1], info[2], 25000);
        flag = 0;
    }
    else
    {

        flag = (flag << 1);
        flag = flag + sig;
    }
    //  fprintf(stderr, "\n flag %u\n", flag);
}
int main()
{
    init_tsf();
    // ffp = popen("ffplay -i pipe:0 -ac 1 -ar 31000 -f f32le","w");

    for (int i = 11; i <= 46; i++)
    {
        signal(i, my_function);
    }
    while (1)
    {
        sleep(11);
    }
    return 0;
}
#endif
