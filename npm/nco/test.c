#include <stdio.h>
#include <string.h>
#include <math.h>
#include "wavetable_oscillator.c"
#include "wavetables.c"

#include "wavetable_oscillator.c"

int main()
{
	void *ref = init_oscillators();

	FILE *w = popen("ffplay  -ac 2 -ar 48000 -f f32le -i pipe:0", "w");

	for (int midi = 60; midi < 70; midi++)
	{
		set_midi(0, midi);
		oscillator[0].fadeDim1Increment = 355.0f / WAVETABLE_SIZE;
		oscillator[0].fadeDim1 = .1f; // = 1.0f / 44100.0f;

		for (int i = 0; i < 48000; i += SAMPLE_BLOCKSIZE)
		{
			wavetable_1dimensional_oscillator(&oscillator[0]);
			//	fwrite(oscillator[0].output_ptr, 4, 128, f);
			fwrite(oscillator[0].output_ptr, 4, SAMPLE_BLOCKSIZE, w);
		}
		//	break;
	}
	//	pclose(f);
	pclose(w);
}
