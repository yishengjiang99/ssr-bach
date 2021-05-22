
#include "sf2.h"
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
extern float powf(float b, float exp);
extern void *malloc(unsigned int size);
extern float sqrtf(float x);

extern void gmemcpy(void *dest, const void *src, unsigned int n);
extern void perror(char *msg);
void loadpdta(void *pdtabuffer)
{
	section_header *sh;
#define read(section)                         \
	sh = (section_header *)pdtabuffer;          \
	pdtabuffer += 8;                            \
	n##section##s = sh->size / sizeof(section); \
	section##s = (section *)pdtabuffer;         \
	pdtabuffer += sh->size;

	read(phdr);
	read(pbag);
	read(pmod);
	read(pgen);
	read(inst);
	read(ibag);
	read(imod);
	read(igen);
	read(shdr);
}
typedef struct
{
	int lokey, hikey, lovel, hive;
} filter_t;
typedef struct
{
	rangesType vel, key;
	pgen_t *gen;
} genlist;

typedef struct
{
	int pid, bkid;
	genlist *pgenList;
	genlist *igenList;
} preset;

void mkIndex()
{
	pbag *lastBag = pbags + npbags;
	for (int i = 0; i < nphdrs - 1; i++)
	{
		preset p = {phdrs[i].pid, phdrs[i].bankId, 0, 0};
		genlist **tr = &(p.pgenList);
		pbag *pg = pbags + phdrs[i].pbagNdx;

		for (int k = pg->pgen_id; k < (pg + 1)->pgen_id; k++)
		{
			pgen_t *g = pgens + k;
			if (g->operator== 44)
			{
				(*tr)->vel = g->val.ranges;
			}
			if (g->operator== 43)
			{
				(*tr)->key = g->val.ranges;
			}
			*((*tr)->gen++) = *g;
		}
	}
}
void get_sf(int pid, int bkid, int key, int vel, zone_t *z1, zone_t *z2)
{

	short *attributes;
	short igset[60];
	int instID = -1;
	int lastSampId;
	short *pdef;

	for (int i = 0; i < nphdrs - 1; i++)
	{
		if (phdrs[i].bankId != bkid || phdrs[i].pid != pid)
			continue;
		int lastbag = phdrs[i + 1].pbagNdx;
		for (int j = phdrs[i].pbagNdx; j < lastbag; j++)
		{
			pbag *pg = pbags + j;
			pgen_t *lastg = pgens + pg[j + 1].pgen_id;
			int pgenId = pg->pgen_id;
			int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
			short pgset[60];
			short pgdef[60];
			instID = -1;
			for (int k = pgenId; k < lastPgenId; k++)
			{
				pgen_t *g = pgens + k;

				if (vel > -1 && g->operator== 44 &&(g->val.ranges.lo > vel || g->val.ranges.hi < vel))
					break;
				if (key > -1 && g->operator== 43 &&(g->val.ranges.lo > key || g->val.ranges.hi < key))
					break;
				if (g->operator== 41)
				{
					instID = g->val.shAmount;
				}
				pgset[g->operator] = g->val.shAmount;
			}
			if (instID == -1)
			{
				gmemcpy(pgdef, pgset, sizeof(pgset));
			}
			else
			{
				inst *ihead = insts + instID;
				int ibgId = ihead->ibagNdx;
				int lastibg = (ihead + 1)->ibagNdx;
				short igdef[60] = {-1};
				for (int ibg = ibgId; ibg < lastibg; ibg++)
				{
					lastSampId = -1;
					short igset[60] = {-1};
					ibag *ibgg = ibags + ibg;
					pgen_t *lastig = ibg < nibags - 1 ? igens + (ibgg + 1)->igen_id : igens + nigens - 1;
					for (pgen_t *g = igens + ibgg->igen_id; g->operator!= 60 && g != lastig; g++)
					{

						if (vel > -1 && g->operator== 44 &&(g->val.ranges.lo > vel || g->val.ranges.hi < vel))
							break;
						if (key > -1 && g->operator== 43 &&(g->val.ranges.lo > key || g->val.ranges.hi < key))
							break;
						igset[g->operator]=g->val.shAmount;
						if (g->operator== 53)
						{
							lastSampId = g->val.shAmount; // | (ig->val.ranges.hi << 8);
						}
					}
					if (lastSampId > -1)
					{
						attributes = (short *)malloc(sizeof(short) * 60);
						for (int i = 0; i < 60; i++)
						{
							if (igset[i] != -1)
								*(attributes + i) = igset[i];
							else if (igdef[i] != -1)
								*(attributes + i) = igdef[i];
							else
							{
								*(attributes + i) = 0;
							}

							if (pgset[i] != -1)
								*(attributes + i) += pgset[i];
							else if (pgdef[i] != -1)
								*(attributes + i) += pgdef[i];
						}
						z1 = (zone_t *)attributes;
					}
				}
			}
		}
	}
}