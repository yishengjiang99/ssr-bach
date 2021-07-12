#include "lerp.c"

typedef struct shiftr
{
	float frac;
	unsigned int pos;
} shift_t;
extern void consolelog(char *str, float f);-p
void autotune(float *sample, float *res, int n, int loopstart, int loopend, int blocksize, float ratio)
{
	int pos = 0;
	float frag = 0.0f;
	consolelog("int n is ", n * 1.0f);
	consolelog("loopstart is ", n * 1.0f);
	consolelog("samp add is ", *sample);

	for (int i = 0; i < n - 1; i++)
	{
		*(res + i) = lerp(*(sample + pos), *(sample + pos + 1), frag);

		frag += ratio;
		while (frag >= 1.0f)
		{
			pos++;
			frag--;
		}
		if (pos >= n)
		{
			pos -= (loopend - loopstart) + 1;
		}
	}
}
