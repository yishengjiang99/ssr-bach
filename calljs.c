#include <stdlib.h>
#include <stdio.h>
extern void my_js(void *data);
typedef struct
{
	float x, y;
} Point;
int main()
{
	Point p = {1.2f, 1.3f};

	my_js((void *)&p);
	return 1;
}