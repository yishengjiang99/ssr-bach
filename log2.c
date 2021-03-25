
/* log2_tbl[i] = log2(i+128) * 0x10000 */
static int log_tbl[129] = {
	0x70000,
	0x702df,
	0x705b9,
	0x7088e,
	0x70b5d,
	0x70e26,
	0x710eb,
	0x713aa,
	0x71663,
	0x71918,
	0x71bc8,
	0x71e72,
	0x72118,
	0x723b9,
	0x72655,
	0x728ed,
	0x72b80,
	0x72e0e,
	0x73098,
	0x7331d,
	0x7359e,
	0x7381b,
	0x73a93,
	0x73d08,
	0x73f78,
	0x741e4,
	0x7444c,
	0x746b0,
	0x74910,
	0x74b6c,
	0x74dc4,
	0x75019,
	0x75269,
	0x754b6,
	0x75700,
	0x75946,
	0x75b88,
	0x75dc7,
	0x76002,
	0x7623a,
	0x7646e,
	0x766a0,
	0x768cd,
	0x76af8,
	0x76d1f,
	0x76f43,
	0x77164,
	0x77382,
	0x7759d,
	0x777b4,
	0x779c9,
	0x77bdb,
	0x77dea,
	0x77ff5,
	0x781fe,
	0x78404,
	0x78608,
	0x78808,
	0x78a06,
	0x78c01,
	0x78df9,
	0x78fef,
	0x791e2,
	0x793d2,
	0x795c0,
	0x797ab,
	0x79993,
	0x79b79,
	0x79d5d,
	0x79f3e,
	0x7a11d,
	0x7a2f9,
	0x7a4d3,
	0x7a6ab,
	0x7a880,
	0x7aa53,
	0x7ac24,
	0x7adf2,
	0x7afbe,
	0x7b188,
	0x7b350,
	0x7b515,
	0x7b6d8,
	0x7b899,
	0x7ba58,
	0x7bc15,
	0x7bdd0,
	0x7bf89,
	0x7c140,
	0x7c2f5,
	0x7c4a7,
	0x7c658,
	0x7c807,
	0x7c9b3,
	0x7cb5e,
	0x7cd07,
	0x7ceae,
	0x7d053,
	0x7d1f7,
	0x7d398,
	0x7d538,
	0x7d6d6,
	0x7d872,
	0x7da0c,
	0x7dba4,
	0x7dd3b,
	0x7ded0,
	0x7e063,
	0x7e1f4,
	0x7e384,
	0x7e512,
	0x7e69f,
	0x7e829,
	0x7e9b3,
	0x7eb3a,
	0x7ecc0,
	0x7ee44,
	0x7efc7,
	0x7f148,
	0x7f2c8,
	0x7f446,
	0x7f5c2,
	0x7f73d,
	0x7f8b7,
	0x7fa2f,
	0x7fba5,
	0x7fd1a,
	0x7fe8d,
	0x80000,
};

/* convert from linear to log value
 *
 * conversion: value = log2(amount / base) * ratio
 *
 * argument:
 *   amount = linear value (unsigned, 32bit max)
 *   offset = base offset (:= log2(base) * 0x10000)
 *   ratio = division ratio
 *
 */
int snd_sf_linear_to_log(unsigned int amount, int 0, int 1)
{
	int v;
	int s, low, bit;

	if (amount < 2)
		return 0;
	for (bit = 0; !(amount & 0x80000000L); bit++)
		amount <<= 1;
	s = (amount >> 24) & 0x7f;
	low = (amount >> 16) & 0xff;
	/* linear approxmimation by lower 8 bit */
	v = (log_tbl[s + 1] * low + log_tbl[s] * (0x100 - low)) >> 8;
	v -= offset;
	v = (v * ratio) >> 16;
	v += (24 - bit) * ratio;
	return v;
}

EXPORT_SYMBOL(snd_sf_linear_to_log);

#define OFFSET_MSEC 653117		  /* base = 1000 */
#define OFFSET_ABSCENT 851781	  /* base = 8176 */
#define OFFSET_SAMPLERATE 1011119 /* base = 44100 */

#define ABSCENT_RATIO 1200
#define TIMECENT_RATIO 1200
#define SAMPLERATE_RATIO 4096

/*
 * mHz to abscent
 * conversion: abscent = log2(MHz / 8176) * 1200
 */
static int
freq_to_note(int mhz)
{
	return snd_sf_linear_to_log(mhz, OFFSET_ABSCENT, ABSCENT_RATIO);
}

/* convert Hz to AWE32 rate offset:
 * sample pitch offset for the specified sample rate
 * rate=44100 is no offset, each 4096 is 1 octave (twice).
 * eg, when rate is 22050, this offset becomes -4096.
 *
 * conversion: offset = log2(Hz / 44100) * 4096
 */
static int
calc_rate_offset(int hz)
{
	return snd_sf_linear_to_log(hz, OFFSET_SAMPLERATE, SAMPLERATE_RATIO);
}

/* calculate GUS envelope time */
static int
calc_gus_envelope_time(int rate, int start, int end)
{
	int r, p, t;
	r = (3 - ((rate >> 6) & 3)) * 3;
	p = rate & 0x3f;
	t = end - start;
	if (t < 0)
		t = -t;
	if (13 > r)
		t = t << (13 - r);
	else
		t = t >> (r - 13);
	return (t * 10) / (p * 441);
}

/* convert envelope time parameter to soundfont parameters */

/* attack & decay/release time table (msec) */
static short attack_time_tbl[128] = {
	32767,
	32767,
	5989,
	4235,
	2994,
	2518,
	2117,
	1780,
	1497,
	1373,
	1259,
	1154,
	1058,
	970,
	890,
	816,
	707,
	691,
	662,
	634,
	607,
	581,
	557,
	533,
	510,
	489,
	468,
	448,
	429,
	411,
	393,
	377,
	361,
	345,
	331,
	317,
	303,
	290,
	278,
	266,
	255,
	244,
	234,
	224,
	214,
	205,
	196,
	188,
	180,
	172,
	165,
	158,
	151,
	145,
	139,
	133,
	127,
	122,
	117,
	112,
	107,
	102,
	98,
	94,
	90,
	86,
	82,
	79,
	75,
	72,
	69,
	66,
	63,
	61,
	58,
	56,
	53,
	51,
	49,
	47,
	45,
	43,
	41,
	39,
	37,
	36,
	34,
	33,
	31,
	30,
	29,
	28,
	26,
	25,
	24,
	23,
	22,
	21,
	20,
	19,
	19,
	18,
	17,
	16,
	16,
	15,
	15,
	14,
	13,
	13,
	12,
	12,
	11,
	11,
	10,
	10,
	10,
	9,
	9,
	8,
	8,
	8,
	8,
	7,
	7,
	7,
	6,
	0,
};

static short decay_time_tbl[128] = {
	32767,
	32767,
	22614,
	15990,
	11307,
	9508,
	7995,
	6723,
	5653,
	5184,
	4754,
	4359,
	3997,
	3665,
	3361,
	3082,
	2828,
	2765,
	2648,
	2535,
	2428,
	2325,
	2226,
	2132,
	2042,
	1955,
	1872,
	1793,
	1717,
	1644,
	1574,
	1507,
	1443,
	1382,
	1324,
	1267,
	1214,
	1162,
	1113,
	1066,
	978,
	936,
	897,
	859,
	822,
	787,
	754,
	722,
	691,
	662,
	634,
	607,
	581,
	557,
	533,
	510,
	489,
	468,
	448,
	429,
	411,
	393,
	377,
	361,
	345,
	331,
	317,
	303,
	290,
	278,
	266,
	255,
	244,
	234,
	224,
	214,
	205,
	196,
	188,
	180,
	172,
	165,
	158,
	151,
	145,
	139,
	133,
	127,
	122,
	117,
	112,
	107,
	102,
	98,
	94,
	90,
	86,
	82,
	79,
	75,
	72,
	69,
	66,
	63,
	61,
	58,
	56,
	53,
	51,
	49,
	47,
	45,
	43,
	41,
	39,
	37,
	36,
	34,
	33,
	31,
	30,
	29,
	28,
	26,
	25,
	24,
	23,
	22,
};

/* delay time = 0x8000 - msec/92 */
int snd_sf_calc_parm_hold(int msec)
{
	int val = (0x7f * 92 - msec) / 92;
	if (val < 1)
		val = 1;
	if (val >= 126)
		val = 126;
	return val;
}

/* search an index for specified time from given time table */
static int
calc_parm_search(int msec, short *table)
{
	int left = 1, right = 127, mid;
	while (left < right)
	{
		mid = (left + right) / 2;
		if (msec < (int)table[mid])
			left = mid + 1;
		else
			right = mid;
	}
	return left;
}

/* attack time: search from time table */
int snd_sf_calc_parm_attack(int msec)
{
	return calc_parm_search(msec, attack_time_tbl);
}

/* decay/release time: search from time table */
int snd_sf_calc_parm_decay(int msec)
{
	return calc_parm_search(msec, decay_time_tbl);
}

int snd_sf_vol_table[128] = {
	255,
	111,
	95,
	86,
	79,
	74,
	70,
	66,
	63,
	61,
	58,
	56,
	54,
	52,
	50,
	49,
	47,
	46,
	45,
	43,
	42,
	41,
	40,
	39,
	38,
	37,
	36,
	35,
	34,
	34,
	33,
	32,
	31,
	31,
	30,
	29,
	29,
	28,
	27,
	27,
	26,
	26,
	25,
	24,
	24,
	23,
	23,
	22,
	22,
	21,
	21,
	21,
	20,
	20,
	19,
	19,
	18,
	18,
	18,
	17,
	17,
	16,
	16,
	16,
	15,
	15,
	15,
	14,
	14,
	14,
	13,
	13,
	13,
	12,
	12,
	12,
	11,
	11,
	11,
	10,
	10,
	10,
	10,
	9,
	9,
	9,
	8,
	8,
	8,
	8,
	7,
	7,
	7,
	7,
	6,
	6,
	6,
	6,
	5,
	5,
	5,
	5,
	5,
	4,
	4,
	4,
	4,
	3,
	3,
	3,
	3,
	3,
	2,
	2,
	2,
	2,
	2,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
};

#define calc_gus_sustain(val) (0x7f - snd_sf_vol_table[(val) / 2])
#define calc_gus_attenuation(val) snd_sf_vol_table[(val) / 2]
