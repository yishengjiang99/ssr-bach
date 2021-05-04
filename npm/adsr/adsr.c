#include "luts.c"
typedef unsigned int uint32_t;
typedef struct
{
	uint32_t att_steps, decay_steps, release_steps;
	unsigned short sustain;
	int db_attenuate;
	float att_rate, decay_rate, release_rate;
} adsr_t;

__attribute__((visibility("default"))) float p2over1200(float x)
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
__attribute__((visibility("default"))) adsr_t *newEnvelope(short centAtt, short centRelease, short centDecay, short sustain, int sampleRate)
{
	adsr_t envs[1];
	adsr_t *env = &envs[0];

	env->att_steps = fmax(p2over1200(centAtt) * sampleRate, 2);
	env->decay_steps = fmax(p2over1200(centDecay) * sampleRate, 2);
	env->release_steps = fmax(p2over1200(centRelease) * sampleRate, 2);
	env->att_rate = -960.0f / env->att_steps;
	env->decay_rate = ((float)1.0f * sustain) / (env->decay_steps);
	env->release_rate = (float)(960.0f - sustain) / (env->release_steps);
	env->db_attenuate = 960.0f;
	return env;
}
__attribute__((visibility("default"))) float envShift(adsr_t *env)
{
	if (env->att_steps > 0)
	{
		env->att_steps--;
		env->db_attenuate += env->att_rate;
	}
	else if (env->decay_steps > 0)
	{
		env->decay_steps--;
		env->db_attenuate += env->decay_rate;
	}
	else if (env->release_steps > 0)
	{
		env->release_steps--;
		env->db_attenuate += env->release_rate;
	}
	if (env->db_attenuate > 960)
	{
		env->db_attenuate = 960.0f;
	}
	if (env->db_attenuate < 0.0)
	{
		env->db_attenuate = 0.0f;
	}
	return env->db_attenuate;
}
__attribute__((visibility("default"))) void adsrRelease(adsr_t *env)

{
	env->decay_steps = 0;
	env->att_steps = 0;
}