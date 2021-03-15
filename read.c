#include <stdio.h>
#include <stdlib.h>
#include "gen_ops.h"
#include <strings.h>
#include <math.h>
#define max(a, b) a > b ? a : b
#define min(a, b) a < b ? b : a
#define SFGEN_startAddrsOffset 0
#define SFGEN_endAddrsOffset 1
#define SFGEN_startloopAddrsOffset 2
#define SFGEN_endloopAddrsOffset 3
#define SFGEN_startAddrsCoarseOffset 4
#define SFGEN_modLfoToPitch 5
#define SFGEN_vibLfoToPitch 6
#define SFGEN_modEnvToPitch 7
#define SFGEN_initialFilterFc 8
#define SFGEN_initialFilterQ 9
#define SFGEN_modLfoToFilterFc 10
#define SFGEN_modEnvToFilterFc 11
#define SFGEN_endAddrsCoarseOffset 12
#define SFGEN_modLfoToVolume 13
#define SFGEN_unused1 14
#define SFGEN_chorusEffectsSend 15
#define SFGEN_reverbEffectsSend 16
#define SFGEN_pan 17
#define SFGEN_unused2 18
#define SFGEN_unused3 19
#define SFGEN_unused4 20
#define SFGEN_delayModLFO 21
#define SFGEN_freqModLFO 22
#define SFGEN_delayVibLFO 23
#define SFGEN_freqVibLFO 24
#define SFGEN_delayModEnv 25
#define SFGEN_attackModEnv 26
#define SFGEN_holdModEnv 27
#define SFGEN_decayModEnv 28
#define SFGEN_sustainModEnv 29
#define SFGEN_releaseModEnv 30
#define SFGEN_keynumToModEnvHold 31
#define SFGEN_keynumToModEnvDecay 32
#define SFGEN_delayVolEnv 33
#define SFGEN_attackVolEnv 34
#define SFGEN_holdVolEnv 35
#define SFGEN_decayVolEnv 36
#define SFGEN_sustainVolEnv 37
#define SFGEN_releaseVolEnv 38
#define SFGEN_keynumToVolEnvHold 39
#define SFGEN_keynumToVolEnvDecay 40
#define SFGEN_instrument 41
#define SFGEN_reserved1 42
#define SFGEN_keyRange 43
#define SFGEN_velRange 44
#define SFGEN_startloopAddrsCoarse 45
#define SFGEN_keynum 46
#define SFGEN_velocity 47
#define SFGEN_initialAttenuation 48
#define SFGEN_reserved2 49
#define SFGEN_endloopAddrsCoarse 50
#define SFGEN_coarseTune 51
#define SFGEN_fineTune 52
#define SFGEN_sampleID 53
#define SFGEN_sampleModes 54
#define SFGEN_reserved3 55
#define SFGEN_scaleTuning 56
#define SFGEN_exclusiveClass 57
#define SFGEN_overridingRootKey 58
#define SFGEN_unused5 59
#define SFGEN_endOper 60
#define fivezeros 0, 0, 0, 0, 0
char *generator[60] = {"Gen_StartAddrOfs", "Gen_EndAddrOfs", "Gen_StartLoopAddrOfs", "Gen_EndLoopAddrOfs", "Gen_StartAddrCoarseOfs", "Gen_ModLFO2Pitch", "Gen_VibLFO2Pitch", "Gen_ModEnv2Pitch", "Gen_FilterFc", "Gen_FilterQ", "Gen_ModLFO2FilterFc", "Gen_ModEnv2FilterFc", "Gen_EndAddrCoarseOfs", "Gen_ModLFO2Vol", "Gen_Unused1", "Gen_ChorusSend", "Gen_ReverbSend", "Gen_Pan", "Gen_Unused2", "Gen_Unused3", "Gen_Unused4", "Gen_ModLFODelay", "Gen_ModLFOFreq", "Gen_VibLFODelay", "Gen_VibLFOFreq", "Gen_ModEnvDelay", "Gen_ModEnvAttack", "Gen_ModEnvHold", "Gen_ModEnvDecay", "Gen_ModEnvSustain", "Gen_ModEnvRelease", "Gen_Key2ModEnvHold", "Gen_Key2ModEnvDecay", "Gen_VolEnvDelay", "Gen_VolEnvAttack", "Gen_VolEnvHold", "Gen_VolEnvDecay", "Gen_VolEnvSustain", "Gen_VolEnvRelease", "Gen_Key2VolEnvHold", "Gen_Key2VolEnvDecay", "Gen_Instrument", "Gen_Reserved1", "Gen_KeyRange", "Gen_VelRange", "Gen_StartLoopAddrCoarseOfs", "Gen_Keynum", "Gen_Velocity", "Gen_Attenuation", "Gen_Reserved2", "Gen_EndLoopAddrCoarseOfs", "Gen_CoarseTune", "Gen_FineTune", "Gen_SampleId", "Gen_SampleModes", "Gen_Reserved3", "Gen_ScaleTune", "Gen_ExclusiveClass", "Gen_OverrideRootKey", "Gen_Dummy"};
uint16_t default_gen_vals[60] = {
	fivezeros,
	fivezeros,
	fivezeros,
	fivezeros,
	-11500, //SFGEN_delayModEnv 25
	-11500,
	-11500,
	-11500,
	240,	//sustain vol
	-11500, //30
	0,
	0,
	-11500, //SFGEN_delayVolEnv 33
	-11500,
	-11500,
	-11500,
	240, //sustain vol
	-11500,
	0,
	0,
	-1, //instrument
	0,
	127 << 7 | 0, //velrange+keyrange
	127 << 7 | 0,
	fivezeros, fivezeros, fivezeros, fivezeros

};

typedef uint8_t uint8_t;
typedef uint32_t uint32_t; // uint32_t;
typedef uint32_t FOURCC;
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
} header_t;

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
typedef enum
{
	monoSample = 1,
	rightSample = 2,
	leftSample = 4,
	linkedSample = 8,
	RomMonoSample = 0x8001,
	RomRightSample = 0x8002,
	RomLeftSample = 0x8004,
	RomLinkedSample = 0x8008
} SFSampleLink;
typedef struct
{
	char name[4];
	unsigned int size;
	char *data;
} pdta;
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

typedef struct
{
	unsigned short operator;
	genAmountType val;
} igen;
typedef struct
{
	char achSampleName[20];
	uint32_t dwStart;
	uint32_t dwEnd;
	uint32_t dwStartloop;
	uint32_t dwEndloop;
	uint32_t dwSampleRate;
	uint8_t byOriginalKey;
	char chCorrection;
	int8_t wSampleLink;
	SFSampleLink sfSampleType;
} shdr;
typedef struct
{
	short delay, attack, hold, decay, release;
	unsigned short sustain;
} envelope;
typedef struct
{
	uint8_t lokey, hikey, lovel, hivel;
	shdr *sampl;
	short attentuation, lpf_cutff, lpf_q;
	float pitchAdjust;
	envelope vol, lfomod;
} zone;
typedef struct
{
	phdr header;
	zone *zones;
	int nzones;
} preset_t;

typedef struct
{
	int n;
	pgen_t *genlist;
} gen_set;
typedef struct
{
	inst *iheader;
	int ngenSets;
	gen_set *genSetList;

} instSet;
int main(int argc, char **argv)
{
	unsigned int size, size2L;
	FILE *fd = fopen(argc > 2 ? argv[2] : "./sf2/GeneralUserGS.sf2", "r");
	header_t *header = (header_t *)malloc(sizeof(header_t));
	header2_t *h2 = (header2_t *)malloc(sizeof(header2_t));
	fread(header, sizeof(header_t), 1, fd);
	printf("%.4s %.4s %.4s %u", header->name, header->sfbk, header->list, header->size);

	fread(h2, sizeof(header2_t), 1, fd);
	printf("\n%.4s %u", h2->name, h2->size);
	fseek(fd, h2->size, SEEK_CUR);
	fread(h2, sizeof(header2_t), 1, fd);
	printf("\n%.4s %u", h2->name, h2->size);
	fseek(fd, h2->size, SEEK_CUR);
	fread(h2, sizeof(header2_t), 1, fd);
	printf("\n%.4s %u\n", h2->name, h2->size);
	int npresets, npbags, npgens, npmods, nshdrs, ninst, nimods, nigens, ishdrs, nibags;
	section_header *sh = (section_header *)malloc(sizeof(section_header));

	fread(sh, sizeof(section_header), 1, fd);
	npresets = sh->size / sizeof(phdr);
	phdr *phdrs = (phdr *)malloc(sh->size);
	fread(phdrs, sizeof(phdr), sh->size / sizeof(phdr), fd);
	printf("%.4s:%u--%d\n", sh->name, sh->size, npresets);

	fread(sh, sizeof(section_header), 1, fd);
	printf("%.4s:%u\n", sh->name, sh->size);
	npbags = sh->size / sizeof(pbag);
	pbag *pbags = (pbag *)malloc(sh->size);
	fread(pbags, sizeof(pbag), sh->size / sizeof(pbag), fd);

	fread(sh, sizeof(section_header), 1, fd);
	printf("%.4s:%u\n", sh->name, sh->size);
	npmods = sh->size / sizeof(pmod);
	pmod *pmods = (pmod *)malloc(sh->size);
	fread(pmods, sizeof(pmod), sh->size / sizeof(pmod), fd);
	fread(sh, sizeof(section_header), 1, fd);
	printf("%.4s:%u\n", sh->name, sh->size);
	npgens = sh->size / sizeof(pgen_t);
	pgen_t *pgens = (pgen_t *)malloc(sh->size);
	fread(pgens, sizeof(pgen_t), sh->size / sizeof(pgen_t), fd);

	fread(sh, sizeof(section_header), 1, fd);
	printf("%.4s:%u\n", sh->name, sh->size);
	ninst = sh->size / sizeof(pgen_t);
	inst *insts = (inst *)malloc(sh->size);
	fread(insts, sizeof(inst), sh->size / sizeof(inst), fd);

	fread(sh, sizeof(section_header), 1, fd);
	nibags = sh->size / sizeof(ibag);
	printf("%.4s:%u %u\n", sh->name, sh->size, nibags);
	ibag *ibags = (ibag *)malloc(sh->size);
	fread(ibags, sizeof(ibag), sh->size / sizeof(ibag), fd);

	fread(sh, sizeof(section_header), 1, fd);
	printf("%.4s:%u\n", sh->name, sh->size);
	nimods = sh->size / sizeof(imod);
	imod *imods = (imod *)malloc(sh->size);
	fread(imods, sizeof(imod), sh->size / sizeof(imod), fd);

	fread(sh, sizeof(section_header), 1, fd);
	printf("%.4s:%u\n", sh->name, sh->size);
	nigens = sh->size / sizeof(pgen_t);
	pgen_t *igens = (pgen_t *)malloc(sh->size);
	fread(igens, sizeof(pgen_t), sh->size / sizeof(pgen_t), fd);

	fread(sh, sizeof(section_header), 1, fd);
	printf("%.4s:%u\n", sh->name, sh->size);
	nshdrs = sh->size / sizeof(shdr);
	shdr *shdrs = (shdr *)malloc(sh->size);
	fread(shdrs, sizeof(shdr), sh->size / sizeof(shdr), fd);
	instSet *instList = (instSet *)malloc(sizeof(instSet));
	instList->ngenSets = 0;
	instSet *instHead = instList;
	for (int i = 0; i < ninst - 1; i++)
	{
		instList->iheader = insts + i;
		printf("\n%.20s %d", instList->iheader->name, i);
		if (!strcmp(instList->iheader->name, "EOI"))
		{
			ninst = i;
			break;
		}
		pgen_t *defaultGens;
		instList->ngenSets = insts[i + 1].ibagNdx - insts[i + 1].ibagNdx;
		int gsIdx = 0;
		instList->genSetList = (gen_set *)malloc(instList->ngenSets * sizeof(gen_set *));
		for (int j = insts[i].ibagNdx; j < insts[i + 1].ibagNdx; j++)
		{
			//printf("\ni -bag%d %d", i, j);
			int hasinstt = 0;
			int n_ibag_gens = ibags[j + 1].igen_id - ibags[j].igen_id;
			gen_set igenset = instList->genSetList[gsIdx];
			gsIdx++;
			igenset.genlist = (pgen_t *)malloc(sizeof(pgen_t) * 60);
			for (int i = 0; i < 60; i++)
			{
				igenset.genlist[i].operator= i;
				igenset.genlist[i].val.shAmount = default_gen_vals[i];
			}
			for (int k = ibags[j].igen_id; k < ibags[j + 1].igen_id; k++)
			{
				igenset.genlist[igens[k].operator]=igens[k];
			}
			if (igenset.genlist[SFGEN_sampleID].val.shAmount < 0)
			{
				if (!defaultGens)
					defaultGens = igenset.genlist; // = defaultGens || igenset.genlist;
			}
			else
			{
				for (int i = 0; i < 60; i++)
				{
					if (!igenset.genlist[i].val.shAmount && defaultGens[i].val.shAmount)
					{
						igenset.genlist[i].val.shAmount = defaultGens[i].val.shAmount;
					}
				}
			}
		}
		instList++;
	}

	for (int i = 0; i < npresets - 1; i++)
	{
		preset_t *preset = (preset_t *)malloc(sizeof(preset_t));
		preset->header = phdrs[i]; // = insts + i;
		printf("\n%.20s %d %d", preset->header.name, preset->header.bankId, preset->header.pid);
		pgen_t *defaultPgens;
		for (int j = phdrs[i].pbagNdx; j < npbags && j < phdrs[i + 1].pbagNdx; j++)
		{
			printf("\n\t pbag %d %d", i, j);
			int hasinstt = 0;
			int n = pbags[j + 1].pgen_id - pbags[j].pgen_id;
			pgen_t *pgenset = (pgen_t *)malloc(sizeof(pgen_t) * 60);

			for (int i = 0; i < 60; i++)
			{
				pgenset[i].operator= i;
				pgenset[i].val.uAmount = default_gen_vals[i];
			}
			for (int k = pbags[j].pgen_id; k < npgens - 1 && k < pbags[j + 1].pgen_id; k++)
			{
				pgen_t g = pgens[k];
				pgenset[g.operator] = g;
			}
			if (pgenset[SFGEN_instrument].val.shAmount == 0)
			{
				if (!defaultPgens)
					defaultPgens = pgenset;
			}
			else
			{
				if (pgenset[SFGEN_instrument].val.shAmount > ninst - 1)
					continue;
				printf("has inst %d", pgenset[SFGEN_instrument].val.shAmount);
				if (!defaultPgens)
					printf("no deafult for inst yet");
				for (int i = 0; i < 60; i++)
				{
					if (!pgenset[i].val.shAmount && defaultPgens[i].val.shAmount)
					{
						pgenset[i].val.shAmount = defaultPgens[i].val.shAmount;
					}
				}
				printf("inst list to %d", pgenset[SFGEN_instrument].val.shAmount);
				instSet *instLayer = instHead + pgenset[SFGEN_instrument].val.shAmount;
				for (int i = 0; i < instLayer->ngenSets; i++)
				{
					gen_set *instGen = instLayer->genSetList + i;
					//instGen->genlist;
					shdr *samples = shdrs + instGen->genlist[SFGEN_sampleID].val.shAmount;
					zone z = *(zone *)malloc(sizeof(z));
					z.sampl = shdrs + instGen->genlist[SFGEN_sampleID].val.shAmount;
					z.lovel = max(instGen->genlist[SFGEN_velRange].val.ranges.lo, pgenset[SFGEN_velRange].val.ranges.lo);
					z.hivel = min(instGen->genlist[SFGEN_velRange].val.ranges.lo, pgenset[SFGEN_velRange].val.ranges.hi);
					z.lokey = max(instGen->genlist[SFGEN_keyRange].val.ranges.lo, pgenset[SFGEN_velRange].val.ranges.lo);
					z.hivel = min(instGen->genlist[SFGEN_keyRange].val.ranges.hi, pgenset[SFGEN_velRange].val.ranges.hi);
					z.attentuation = instGen->genlist[SFGEN_initialAttenuation].val.shAmount;
					z.attentuation += pgenset[SFGEN_initialAttenuation].val.shAmount;
					z.lpf_cutff = instGen->genlist[SFGEN_initialFilterFc].val.shAmount;
					z.lpf_cutff += pgenset[SFGEN_initialFilterFc].val.shAmount;
					z.lpf_q = instGen->genlist[SFGEN_initialFilterQ].val.shAmount;
					z.lpf_q += pgenset[SFGEN_initialFilterQ].val.shAmount;

					int inputKey = instGen->genlist[SFGEN_overridingRootKey].val.shAmount > 0 ? instGen->genlist[SFGEN_overridingRootKey].val.shAmount : samples->byOriginalKey;
					int inputScale = -inputKey * 100;
					inputScale -= instGen->genlist[SFGEN_coarseTune].val.shAmount * 100;
					inputScale -= instGen->genlist[SFGEN_fineTune].val.shAmount;
					float sampleShift = 1200.0f * log2(samples->dwSampleRate / 440) - 1200.0f * log2(48000 / 440);
					float shiftToMidc = 69 + instGen->genlist[SFGEN_coarseTune].val.shAmount + instGen->genlist[SFGEN_fineTune].val.shAmount * 0.01 - inputKey;
					inputScale = 1200 * log2(samples->dwSampleRate / 440) - 1200 * log2(48000 / 440) + inputKey;
					z.pitchAdjust = sampleShift + shiftToMidc;
					preset->zones[preset->nzones] = z;
					preset->nzones++;
					printf("\n %d %d", preset->header.bankId, preset->header.pid);

					printf("\n %d %d", preset->header.bankId, preset->header.pid);
					printf("\n %.5s %d %s\n%f", preset->header.name, preset->nzones, samples->achSampleName, z.pitchAdjust);
				}
			}
		}
	}
}
