#include "adsr.c"
#include "sf2.h"
extern float powf(float b, float exp);
extern void *malloc(unsigned int size);
extern float sqrtf(float x);
extern void perror(char *msg);
#define samples_per_frame 128
#define nchannels 16
#define voiceslots 32

typedef struct
{
	uint8_t program_number, midi_gain, midi_pan, midi_Expression, pitchbend, padding, paddin2, pad3;
} channel_t;
typedef struct _voice
{
	unsigned int start, end, startloop, endloop, pos;
	float frac;
	float ratio;
	float panLeft, panRight;
	adsr_t *ampvol, *modvol;
	unsigned short midi;
	unsigned short velocity;
	unsigned short chid;
} voice;
typedef struct _ctx
{
	uint32_t sampleRate, refcnt, mastVol;
	float outputbuffer[samples_per_frame];
	samples *sampleList;
	float *sampleData;
	channel_t channels[nchannels];
	voice voice[voiceslots];
} ctx_t;

static float p2over1200LUT[1200];
static inline float p2over1200(float x)
{
	if (x < -12000)
		return 0;
	if (x < 0)
		return 1.f / p2over1200(-x);
	else if (x > 1200.0f)
	{
		return 2 * p2over1200(x - 1200.0f);
	}
	else
	{
		return p2over1200LUT[(unsigned short)(x)];
	}
}
static float centdbLUT[960];
static float centdblut(int x)
{
	if (x < 0)
		x = 0;
	if (x > 960)
		x = 960;

	return centdbLUT[x];
}
void set_sample_data(ctx_t *t, void *_sdta, int nsamples)
{
	t->sampleData = _sdta;
}
void set_sample_list(ctx_t *t, samples *shdrlist)
{
	t->sampleList = shdrlist;
}

void apply_zone(ctx_t *ctx, zone_t *z, int channelId, int midi, int vel)
{
	voice vv = ctx->voice[channelId * 2].ampvol->att_steps > 0 ? ctx->voice[channelId * 2] : ctx->voice[channelId * 2 + 1];
	voice *v = &vv;
	samples *sh = ctx->sampleList + z->SampleId;
	if (!v || !sh)
		perror("cannot location sample or voice slot");

	v->start = sh->start + ((unsigned short)(z->StartAddrCoarseOfs & 0x7f) << 15) + (unsigned short)(z->StartAddrOfs & 0x7f);
	v->end = sh->end + ((unsigned short)(z->EndAddrCoarseOfs & 0x7f) << 15) + (unsigned short)(z->EndAddrOfs & 0x7f);
	v->endloop = sh->endloop + ((unsigned short)(z->EndLoopAddrCoarseOfs & 0x7f) << 15) + (unsigned short)(z->EndLoopAddrOfs & 0x7f);
	v->startloop = sh->startloop + (unsigned short)(z->StartLoopAddrCoarseOfs & 0x7f << 15) + (unsigned short)(z->StartLoopAddrOfs & 0x7f);

	newEnvelope(v->ampvol, z->VolEnvAttack, z->VolEnvRelease, z->VolEnvDecay, z->VolEnvSustain, 48000);
	newEnvelope(v->modvol, z->ModEnvAttack, z->ModEnvRelease, z->ModEnvDecay, z->ModEnvSustain, 48000);

	short rt = z->OverrideRootKey > -1 ? z->OverrideRootKey : sh->originalPitch;
	float sampleTone = rt * 100.0f + z->CoarseTune * 100.0f + (float)z->FineTune;
	float octaveDivv = ((float)midi * 100 - sampleTone) / 1200.0f;

	v->ratio = 1.0f * powf(2.0f, octaveDivv) * sh->sampleRate / 48000;

	float attenuate = powf(10.0f, z->Attenuation / -960.0f);

	v->pos = v->start;
	v->frac = 0.0f;
	v->midi = midi;
	v->velocity = vel;
	if (z->Pan < -500)
	{
		v->panLeft = 1.0f;
		v->panRight = 0.0f;
	}
	if (z->Pan > 500)
	{
		v->panLeft = 0.0f;
		v->panRight = 1.0f;
	}
	else
	{
		v->panLeft = sqrtf(0.5 - (float)z->Pan / 1000.f) * attenuate;
		v->panRight = sqrtf(0.5 + (float)z->Pan / 1000.f) * attenuate;
	}
}

void loop(voice *v, float *output);
int ctx_size()
{
	return sizeof(ctx_t);
}
float *get_output(ctx_t *ctx)
{
	return ctx->outputbuffer;
}
void init_ctx(ctx_t *ctx, float *sampleData)
{
	ctx->sampleRate = 48000;
	ctx->refcnt = 0;
	ctx->mastVol = 1.0f;
	ctx->sampleData = sampleData;
}

void render(ctx_t *ctx)
{
	float *output = ctx->outputbuffer;
	for (int i = 0; i < 32; i++)
	{
		if (ctx->voice[i].midi == 0)
			continue;
		voice *v = &ctx->voice[i];
		uint32_t loopLength = v->endloop - v->startloop;

		for (int i = 0; i < samples_per_frame; i++)
		{
			float f1 = *(ctx->sampleData + v->pos);
			float f2 = *(ctx->sampleData + v->pos + 1);
			float gain = f1 + (f2 - f1) * v->frac;

			float mono = gain * centdblut(envShift(v->ampvol));
			*(output + 2 * i) += mono * v->panRight;
			*(output + 2 * i + 1) += mono * v->panLeft;

			v->frac += v->ratio;
			while (v->frac >= 1.0f)
			{
				v->frac--;
				v->pos++;
			}
			while (v->pos >= v->endloop)
			{
				v->pos = v->pos - loopLength + 1;
			}
		}
	}
}

void initLUTs()
{

	for (int i = 0; i < 1199; i++)
	{
		p2over1200LUT[i] = powf(2.0f, i / 1200.0f);
	}

	for (int i = 0; i < 1439; i++)
	{
		centdbLUT[i] = powf(10.0f, i / -200.0);
	}
}