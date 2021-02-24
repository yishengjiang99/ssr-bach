#include <time.h>
#include <stdio.h>

// struct set_interval
// {
// 	int (*callback)();
// 	int interval_msec;
// };

int main(int interval_msec)
{
	int msec = 0, trigger = 10, iterations = 0; /* 10ms */
	clock_t before = clock();
	do
	{
		clock_t difference = clock() - before;
		msec = difference * 1000 / CLOCKS_PER_SEC;
		if (msec > interval_msec)
		{
		}
		iterations++;
	} while (msec < trigger);

	printf("Time taken %d seconds %d milliseconds (%d iterations)\n",
		   msec / 1000, msec % 1000, iterations);
}