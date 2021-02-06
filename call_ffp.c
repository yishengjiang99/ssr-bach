#include "read.c"
#include <math.h>
int main()
{
	init();
	FILE* ffplay;
	int sr;
	unsigned int n = 31000;
	ffplay = popen("ffplay -i pipe:0 -f f32le -ac 1 -ar 31000", "w");
	float *b = (float *)malloc(n * sizeof(float));
	sr=ssample(0, 4, 34, b, n);
	for(int midi = 34; midi<64; midi++){
		ssample(0, midi, 120-midi, b, n);
		fwrite(b, n, sizeof(float), ffplay);
	
	}
	return 0;
}

  float poww(int n, int b)  {
    if (b < 0) {
      return 1 / poww(n, -1 * b);
    } else if (n == 2 && b > 0.083 && b < 0.08333) {
      return 1.05946309f;
    } else if (n == 2 && b > 0.16 && b < 0.1666) {
      return 1.122462048f;
    } else if (n == 2 && b == 0.25) {
      // && b<0.17){
      return 1.1892071f;
    } else {
      return powf(n, b);
    }
  };