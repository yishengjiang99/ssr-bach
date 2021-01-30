#include "minisdl_audio.h"
#include "fcntl.h"

#define TSF_IMPLEMENTATION
#include "../tsf.h"
int write(int, void *, int);
// Holds the global instance pointer
static tsf *g_TinySoundFont;
int main(int argc, char *argv[])
{
	int i, Notes[7] = {48, 50, 52, 53, 55, 57, 59};
	int fd = fopen("p.pcm", "wb");
	// Load the SoundFont from a file
	g_TinySoundFont = tsf_load_filename("default.sf2");
	if (!g_TinySoundFont)
	{
		fprintf(stderr, "Could not load SoundFont\n");
		return 1;
	}

	// Set the SoundFont rendering output mode
	tsf_set_output(g_TinySoundFont, TSF_STEREO_INTERLEAVED, 48000, 0);

	// Create the mutex

	// Loop through all the presets in the loaded SoundFont
	for (i = 0; i < tsf_get_presetcount(g_TinySoundFont); i++)
	{
		//Get exclusive mutex lock, end the previous note and play a new note
		printf("Play note %d with preset #%d '%s'\n", Notes[i % 7], i, tsf_get_presetname(g_TinySoundFont, i));

		tsf_note_off(g_TinySoundFont, i - 1, Notes[(i - 1) % 7]);
		tsf_note_on(g_TinySoundFont, i, Notes[i % 7], 1.0f);

		// //get exclusive lock
		int n = 10240;
		float *stream = (float *)malloc(n * 2 * 4);

		tsf_render_float(g_TinySoundFont, (float *)stream, n, 0);
		// write(fd, &stream, n * 2 * 4);

		fwrite(stream, 4, n * 2, stdout);
	}

	// We could call tsf_close(g_TinySoundFont) and SDL_DestroyMutex(g_Mutex)
	// here to free the memory and resources but we just let the OS clean up
	// because the process ends here.
	return 0;
}
