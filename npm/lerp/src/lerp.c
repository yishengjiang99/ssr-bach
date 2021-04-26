
float lerp(float v0, float v1, float t)
{
  return v0 + t * (v1 - v0);
}

float pow2over2table[12] = {
    1,
    1.0594630943592953,
    1.122462048309373,
    1.189207115002721,
    1.2599210498948732,
    1.3348398541700344,
    1.4142135623730951,
    1.4983070768766815,
    1.5874010519681994,
    1.6817928305074292,
    1.7817974362806788,
    1.887748625363387};

float pow2over12d(int rdiff, int res)
{
  float ratio = 1;
  while (rdiff > res)
  {
    ratio *= 2;
    rdiff -= res;
  }
  while (rdiff < -res)
  {
    ratio /= 2;
    rdiff += res;
  }

  ratio = rdiff >= 0 ? ratio * pow2over2table[rdiff] : ratio / pow2over2table[-1 * rdiff];
  return ratio;
}
float pow2over12(float rdiff)
{
  return pow2over12d(rdiff << 8)
}
