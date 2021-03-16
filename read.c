#include <stdio.h>
#include <stdlib.h>
#include "read.h"
#include <string.h>
#include <math.h>
#include <assert.h>
static phdr *phdrs;
static pbag *pbags;
static pmod *pmods;
static pgen_t *pgens;
static inst *insts;
static pgen_t *igens;
static ibag *ibags;
static imod *imods;
static shdr *shdrs;
int npresets, npbags, npgens, npmods, nshdrs, ninst, nimods, nigens, ishdrs, nibags;
typedef struct
{
	uint8_t lokey, hikey, lovel, hivel;
	short attentuation, lpf_cutff, lpf_q;
	float pitchAdjust;
	short a, d, s, r;
	int start, end, loopStart, loopEnd, sampleRate;
} zone;
#ifndef EMSCRIPTEN_KEEPALIVE
#define EMSCRIPTEN_KEEPALIVE /**/
void upload(int n, void *data);
void upload(int n, void *data)
{
	zone *zz;
	zz = (zone *)data;
	printf("upload %lu", zz->start);
}
#else
EMSCRIPTEN_KEEPALIVE extern void upload(void *data);
#endif

EMSCRIPTEN_KEEPALIVE
extern void upload(int n, void *data);

EMSCRIPTEN_KEEPALIVE void
rfff()
{
	unsigned int size, size2L;
	FILE *fd = fopen("file.sf2", "r");
	fseek(fd, 0, SEEK_SET);
	header_t *header = (header_t *)malloc(sizeof(header_t));
	header2_t *h2 = (header2_t *)malloc(sizeof(header2_t));
	fread(header, sizeof(header_t), 1, fd);
	fprintf(stdout, "%.4s %.4s %.4s %u", header->name, header->sfbk, header->list, header->size);
	fread(h2, sizeof(header2_t), 1, fd);
	fprintf(stdout, "\n%.4s %u", h2->name, h2->size);
	fseek(fd, h2->size, SEEK_CUR);
	fread(h2, sizeof(header2_t), 1, fd);
	fprintf(stdout, "\n%.4s %u", h2->name, h2->size);
	fseek(fd, h2->size, SEEK_CUR);
	fread(h2, sizeof(header2_t), 1, fd);
	fprintf(stdout, "\n%.4s %u\n", h2->name, h2->size);
	section_header *sh = (section_header *)malloc(sizeof(section_header));

	fread(sh, sizeof(section_header), 1, fd);
	npresets = sh->size / sizeof(phdr);
	phdrs = (phdr *)malloc(sh->size);
	fread(phdrs, sizeof(phdr), sh->size / sizeof(phdr), fd);
	fprintf(stdout, "%.4s:%u--%d\n", sh->name, sh->size, npresets);

	fread(sh, sizeof(section_header), 1, fd);
	fprintf(stdout, "%.4s:%u\n", sh->name, sh->size);
	npbags = sh->size / sizeof(pbag);
	pbags = (pbag *)malloc(sh->size);
	fread(pbags, sizeof(pbag), sh->size / sizeof(pbag), fd);

	fread(sh, sizeof(section_header), 1, fd);
	fprintf(stdout, "%.4s:%u\n", sh->name, sh->size);
	npmods = sh->size / sizeof(pmod);
	pmods = (pmod *)malloc(sh->size);
	fread(pmods, sizeof(pmod), sh->size / sizeof(pmod), fd);
	fread(sh, sizeof(section_header), 1, fd);
	fprintf(stdout, "%.4s:%u\n", sh->name, sh->size);
	npgens = sh->size / sizeof(pgen_t);
	pgens = (pgen_t *)malloc(sh->size);
	fread(pgens, sizeof(pgen_t), sh->size / sizeof(pgen_t), fd);

	fread(sh, sizeof(section_header), 1, fd);
	ninst = sh->size / sizeof(inst);
	insts = (inst *)malloc(sh->size);
	fread(insts, sizeof(inst), sh->size / sizeof(inst), fd);
	fprintf(stdout, "%.4s:%u %d\n", sh->name, sh->size, ninst);

	fread(sh, sizeof(section_header), 1, fd);
	nibags = sh->size / sizeof(ibag);
	fprintf(stdout, "%.4s:%u %u\n", sh->name, sh->size, nibags);
	ibags = (ibag *)malloc(sh->size);
	fread(ibags, sizeof(ibag), sh->size / sizeof(ibag), fd);

	fread(sh, sizeof(section_header), 1, fd);
	fprintf(stdout, "%.4s:%u\n", sh->name, sh->size);
	nimods = sh->size / sizeof(imod);
	imods = (imod *)malloc(sh->size);
	fread(imods, sizeof(imod), sh->size / sizeof(imod), fd);

	fread(sh, sizeof(section_header), 1, fd);
	fprintf(stdout, "%.4s:%u\n", sh->name, sh->size);
	nigens = sh->size / sizeof(pgen_t);
	igens = (pgen_t *)malloc(sh->size);
	fread(igens, sizeof(pgen_t), sh->size / sizeof(pgen_t), fd);

	fread(sh, sizeof(section_header), 1, fd);
	fprintf(stdout, "%.4s:%u\n", sh->name, sh->size);
	nshdrs = sh->size / sizeof(shdr);
	shdrs = (shdr *)malloc(sh->size);
	fread(shdrs, sizeof(shdr), sh->size / sizeof(shdr), fd);
}

EMSCRIPTEN_KEEPALIVE
void zoneinfo(unsigned short pid, unsigned short key, unsigned short vel)
{
	int bankid = 0;
	if (pid > 127)
	{
		bankid = 9;
		pid = pid - 128;
	}
	static zone defaultZone =
		{
			0, 127,						 //key range
			0, 127,						 //vel range
			0, 0, 0,					 // attentuation, lpf_cutff, lpf_q;
			1.0f,						 //pitch adjust
			-11500, -11500, 300, -11500, //timecent ,timcent, centidecible,timecent
			-1};

	assert(defaultZone.lokey == 0);
	assert(defaultZone.hikey == 127);

	printf("query %hu %hu %d", pid, key, vel);
	for (int pndx = 0; pndx < npresets - 1; pndx++)
	{
		pgen_t psetDefault[60];
		int hasDefault = 0;

		if (phdrs[pndx].bankId != bankid || phdrs[pndx].pid != pid)
			continue;
		for (int j = phdrs[pndx].bagNdx; j < npbags && j < phdrs[pndx + 1].bagNdx; j++)
		{
			pgen_t *pgenset = psetDefault;

			int k = j + 1 < npbags ? pbags[j + 1].pgen_id - 1 : npgens - 1;
			int isZoneDefault = 0, hasInst = 0;
			for (; k >= pbags[j].pgen_id; k--)
			{
				pgen_t g = pgens[k];

				if (!hasInst && pgens[k].operator<SFGEN_instrument)
				{
					if (!hasDefault)
					{
						isZoneDefault = 1;
						hasDefault = 1;
					}
				}
				if (pgens[k].operator== SFGEN_instrument)
				{
					hasInst = 1;
				}

				if (g.operator== SFGEN_velRange &&(g.val.ranges.lo > vel || g.val.ranges.hi < vel))
					goto nextbag;
				if (g.operator== SFGEN_keyRange &&(g.val.ranges.lo > key || g.val.ranges.hi < key))
					goto nextbag;

				if (isZoneDefault)
				{
					psetDefault[g.operator]=g;
					printf("\n default %s %hu", generator[g.operator], g.val.shAmount);
				}
				else
				{
					pgenset[g.operator]=g;
					//printf("\n%s %hu", generator[g.operator], g.val.shAmount);
				}
			}
			if (!hasInst)
			{
				continue;
			}
			else
			{
				int defaultIbag = 0;
				int ddi = pgenset[SFGEN_instrument].val.shAmount;
				if (ddi > ninst + 1)
					continue;
				pgen_t instDefaults[60];
				instDefaults[SFGEN_sampleID].val.shAmount = -1;
				inst *in = &insts[ddi];
				ibag *ib = ibags + in->ibagNdx;
				ibag *lastBag = ibags + insts[ddi + 1].ibagNdx;
				for (; ib < lastBag; ib++)
				{
					int hasSample = 0,
						isInstDefault = 0;
					pgen_t *igenset = instDefaults;
					int igNdx = ib->igen_id;
					int endNdx = (ib + 1)->igen_id;
					for (int k = endNdx - 1; k >= igNdx; k--)
					{
						pgen_t g = igens[k];

						if (g.operator== SFGEN_velRange &&(g.val.ranges.lo > vel || g.val.ranges.hi < vel))
							goto nextbag;
						if (g.operator== SFGEN_keyRange &&(g.val.ranges.lo > key || g.val.ranges.hi < key))
							goto nextbag;
						if (g.operator== SFGEN_sampleID)
						{
							hasSample = 1;
							igenset[g.operator] = g;
						}
						if (defaultIbag == j)
						{
							printf("\ndefaultinst-%s %hu", generator[g.operator], g.val.shAmount);

							instDefaults[g.operator]=g;
						}
						else
						{
							printf("\ninst-%s %hu", generator[g.operator], g.val.shAmount);

							igenset[g.operator] =  g;
						}
					}

					printf("found %d", igenset[SFGEN_sampleID].val.shAmount);
					shdr *samples = shdrs + igenset[SFGEN_sampleID].val.shAmount;

					zone z = defaultZone;
					z.start = samples->dwStart;
					z.end = samples->dwEnd;
					z.loopStart = samples->dwStartloop;
					z.loopEnd = samples->dwEndloop;
					z.sampleRate =
						z.attentuation = igenset[SFGEN_initialAttenuation].val.shAmount;
					z.attentuation += pgenset[SFGEN_initialAttenuation].val.shAmount;
					z.lpf_cutff = igenset[SFGEN_initialFilterFc].val.shAmount;
					z.lpf_cutff += pgenset[SFGEN_initialFilterFc].val.shAmount;
					z.lpf_q = igenset[SFGEN_initialFilterQ].val.shAmount;
					z.lpf_q += pgenset[SFGEN_initialFilterQ].val.shAmount;

					int inputKey = igenset[SFGEN_overridingRootKey].val.shAmount > 0 ? igenset[SFGEN_overridingRootKey].val.shAmount : samples->byOriginalKey;
					int inputScale = -inputKey * 100;
					inputScale -= igenset[SFGEN_coarseTune].val.shAmount * 100;
					inputScale -= igenset[SFGEN_fineTune].val.shAmount;
					float sampleShift = 1200.0f * log2(samples->dwSampleRate / 440) - 1200.0f * log2(48000 / 440);
					float shiftToMidc = key + igenset[SFGEN_coarseTune].val.shAmount + igenset[SFGEN_fineTune].val.shAmount * 0.01 - inputKey;
					inputScale = 1200 * log2(samples->dwSampleRate / 440) - 1200 * log2(48000 / 440) + inputKey;
					z.pitchAdjust = sampleShift + shiftToMidc;
					upload(sizeof(z), (void *)&z);
				}
			nextbag:
				continue;
			}
		}
	}
}
int main()
{
	rfff();
	zoneinfo(0, 54, 22);
}