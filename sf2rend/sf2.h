#ifndef SF2_H
#define SF2_H

typedef unsigned int uint32_t;
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef short int16_t;

typedef struct
{
	uint8_t lo, hi;
} rangesType; //  Four-character code

typedef union
{
	rangesType ranges;
	short shAmount;
	unsigned short uAmount;
} genAmountType;

typedef struct
{
	char name[4];
	unsigned int size;
	char sfbk[4];
	char list[4];
} sheader_t;

typedef struct
{
	unsigned int size;
	char name[4];
} header2_t;
typedef struct
{
	char name[4];
	unsigned int size;
} section_header;

typedef struct
{
	char name[20];
	uint16_t pid, bankId, pbagNdx;
	char idc[12];
} phdr;
typedef struct
{
	unsigned short pgen_id, pmod_id;
} pbag;
typedef struct
{
	unsigned short igen_id, imod_id;
} ibag;
typedef struct
{
	unsigned short operator;
	genAmountType val;
} pgen_t;
typedef pgen_t pgen;
typedef struct
{
	char data[10];
} pmod;
typedef struct
{
	char name[20];
	unsigned short ibagNdx;
} inst;
typedef struct
{
	char data[10];
} imod;
typedef union
{
	uint8_t hi, lo;
	unsigned short val;
	short word;
} gen_val;

typedef pgen_t igen;
typedef struct
{
	// shdr's 46 byters is malloc aligned to 48 and I don't make it stop
	// so we first read 46 chars explicitly and then casted to shdrcast defined
	//beloe
	uint8_t dc[46];
} shdr;

typedef struct
{
	char name[20];
	uint32_t start, end, startloop, endloop, sampleRate;
	int16_t originalPitch;
	signed char pitchCorrection;
	unsigned short wSampleLink;
	unsigned short sfSampleType;
} samples;

typedef struct
{
	short
			StartAddrOfs,
			EndAddrOfs, StartLoopAddrOfs, EndLoopAddrOfs,
			StartAddrCoarseOfs, ModLFO2Pitch, VibLFO2Pitch, ModEnv2Pitch, FilterFc, FilterQ, ModLFO2FilterFc, ModEnv2FilterFc,
			EndAddrCoarseOfs, ModLFO2Vol, Unused1, ChorusSend, ReverbSend, Pan, Unused2, Unused3, Unused4, ModLFODelay, ModLFOFreq, VibLFODelay, VibLFOFreq, ModEnvDelay, ModEnvAttack, ModEnvHold, ModEnvDecay, ModEnvSustain, ModEnvRelease, Key2ModEnvHold, Key2ModEnvDecay, VolEnvDelay, VolEnvAttack, VolEnvHold, VolEnvDecay, VolEnvSustain, VolEnvRelease, Key2VolEnvHold, Key2VolEnvDecay, Instrument, Reserved1, KeyRange, VelRange, StartLoopAddrCoarseOfs, Keynum, Velocity, Attenuation, Reserved2, EndLoopAddrCoarseOfs, CoarseTune, FineTune, SampleId, SampleModes, Reserved3, ScaleTune, ExclusiveClass, OverrideRootKey, Dummy;
} zone_t;

static int nphdrs, npbags, npgens, npmods, nshdrs, ninsts, nimods, nigens, nibags, nshrs;

static phdr *phdrs;
static pbag *pbags;
static pmod *pmods;
static pgen *pgens;
static inst *insts;
static ibag *ibags;
static imod *imods;
static igen *igens;
static shdr *shdrs;
static short *data;
static void *info;
static int nsamples;
static float *sdta;

#endif