
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define TML_NULL 0
typedef unsigned int uint32_t;
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
extern void fetch(char *url, char *output);
// Stream structure for the generic loading
struct tml_stream
{
	// Custom data given to the functions as the first parameter
	void *data;

	// Function pointer will be called to read 'size' bytes into ptr (returns number of read bytes)
	int (*read)(void *data, void *ptr, unsigned int size);
};
struct tml_stream_memory
{
	const char *buffer;
	unsigned int total, pos;
};
static int tml_stream_memory_read(struct tml_stream_memory *m, void *ptr, unsigned int size)
{
	if (size > m->total - m->pos)
		size = m->total - m->pos;
	memcpy(ptr, m->buffer + m->pos, size);
	m->pos += size;
	return size;
}
typedef struct header_t
{
	char name[4], sfbk[4];
	unsigned int size;
	char list[4];

} header_t;
void *sf2_load_from_mem(const void *buffer, int size)
{
	struct tml_stream stream = {TML_NULL, (int (*)(void *, void *, unsigned int)) & tml_stream_memory_read};
	struct tml_stream_memory f = {0, 0, 0};
	f.buffer = (const char *)buffer;
	f.total = size;
	stream.data = &f;
	header_t *header = (header_t *)malloc(sizeof(header_t));
	stream.read(stream.data, header, sizeof(header_t));
	printf("%.4s %.4s %.4s %u\n", header->name, header->sfbk, header->list, header->size);
}
