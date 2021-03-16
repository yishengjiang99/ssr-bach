#include "tml.h"
#include <stdlib.h>
#include <emscripten.h>
#include <string.h>
#include <emscripten/fetch.h>
static tml_message *tm;

EM_JS(void, on_mevent, (uint32_t time, char chan, char type, char v1, char v2), {
	on_mevent(argv);
});
EMSCRIPTEN_KEEPALIVE
void downloadSucceeded(emscripten_fetch_t *fetch)
{
	//printf("Finished downloading %llu bytes from URL %s.\n", fetch->numBytes, fetch->url);
	tm = tml_load_memory(fetch->data, fetch->numBytes);
	on_mevent(0, 0, 99, 0, 0);
	// The data is now available at fetch->data[0] through fetch->data[fetch->numBytes-1];
	emscripten_fetch_close(fetch); // Free data associated with the fetch.
}

void downloadFailed(emscripten_fetch_t *fetch)
{
	emscripten_fetch_close(fetch); // Also free data on failure.
}
EMSCRIPTEN_KEEPALIVE
void go(int t)
{
	while (tm && tm->time < t)
	{
		switch (tm->type)
		{
		case TML_CONTROL_CHANGE:
			on_mevent(tm->time, tm->channel, tm->type, tm->control, tm->control_value);
			break;
		case TML_NOTE_ON:
			on_mevent(tm->time, tm->channel, tm->type, tm->key, tm->velocity);
			break;
		case TML_NOTE_OFF:
			on_mevent(tm->time, tm->channel, tm->type, tm->key, tm->velocity);
			break;
		case TML_PROGRAM_CHANGE:
			on_mevent(tm->time, tm->channel, tm->type, tm->program, 0);
			break;
		case TML_SET_TEMPO:
			on_mevent(tm->time, tm->channel, tm->type, tml_get_tempo_value(tm), 0);
			break;
		default:
			break;
		}
	}
}
EMSCRIPTEN_KEEPALIVE
int init(char *url)
{
	emscripten_fetch_attr_t attr;
	emscripten_fetch_attr_init(&attr);
	strcpy(attr.requestMethod, "GET");
	attr.attributes = EMSCRIPTEN_FETCH_LOAD_TO_MEMORY;
	attr.onsuccess = downloadSucceeded;
	attr.onerror = downloadFailed;
	emscripten_fetch(&attr, url);
	return 0;
}
