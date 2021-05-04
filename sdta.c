/**
 * 
 * sdta stands for sample data.
 *
 * takes n chars and stores it in n/4 floats
 * load(n, void* data, float*floats);
 * 
 *  
*/

typedef struct
{
  unsigned int start, end, startLoop, endLoop, pitchRatio
} nco_params;

void render(short *input, float *output, nco_params *nco_params)
{
}