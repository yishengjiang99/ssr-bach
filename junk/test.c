#include <assert.h>

#include "sample.c"

// In my_sum.c
int my_sum(int a, int b)
{
	return a + b;
}

// In test_my_sum.c
int main(int argc, char *argv[])
{
	init();
	set_track_preset(0, 0);

	struct sample_t *sample=get_track_sample(0, 44, 120, 48000);
	loop(48000,0);
	struct sample_t *samples = get_track_sample(0, 44, 120, 48000);
	loop(48000, 0);

	assert(g_tracks->n== N_CHANNELS);
	assert(g_tracks->tracks != NULL);
	return 0;
}
