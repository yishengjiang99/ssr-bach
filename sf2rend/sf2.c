#include "sf2.h"

#include <stdio.h>
#include <stdlib.h>

#include <string.h>

#define sr 24000
int readsf(FILE *fd)
{
	sheader_t *header = (sheader_t *)malloc(sizeof(sheader_t));
	header2_t *h2 = (header2_t *)malloc(sizeof(header2_t));
	fread(header, sizeof(sheader_t), 1, fd);
	fread(h2, sizeof(header2_t), 1, fd);
	printf("\n%.4s %u", h2->name, h2->size);
	info = malloc(h2->size);
	fread(info, h2->size, 1, fd);
	fread(h2, sizeof(header2_t), 1, fd);
	printf("\n%.4s %u", h2->name, h2->size);
	data = (short *)malloc(h2->size / 2 * sizeof(short));
	sdta = (float *)malloc(h2->size / 2 * sizeof(float));
	float *trace = sdta;
	nsamples = h2->size / sizeof(short);

	printf("\n\t %ld", ftell(fd));
	fread(data, sizeof(short), nsamples, fd);

	for (int i = 0; i < nsamples; i++)
	{
		*trace++ = *(data + i) / 32767.0f;
	}
	//free(data);
	FILE *cache = fopen("cache.dat", "wb");

#define readSection(section)                  \
	fread(sh, sizeof(section_header), 1, fd);   \
	printf("%.4s:%u\n", sh->name, sh->size);    \
	n##section##s = sh->size / sizeof(section); \
	section##s = (section *)malloc(sh->size);   \
	fread(section##s, sizeof(section), sh->size / sizeof(section), fd);

	section_header *sh = (section_header *)malloc(sizeof(section_header));

	fread(h2, sizeof(header2_t), 1, fd);
	printf("%.4s %u \n", h2->name, h2->size);

	readSection(phdr);
	readSection(pbag);
	readSection(pmod);
	readSection(pgen);
	readSection(inst);
	readSection(ibag);
	readSection(imod);
	readSection(igen);
	readSection(shdr);
	samples *c = (samples *)shdrs;
	return 1;
}
typedef struct node
{
	int index;
	pgen_t *gen;

	struct node *next;
	struct node *spawn;
} node_t;
void insert(node_t **head, node_t *newNde)
{
	node_t **tr = head;
	while (*tr)
	{
		tr = &((*tr)->next);
	}

	newNde->next = *tr;
	*tr = newNde;
}
node_t *newNode(pgen_t *gen, int index)
{
	node_t *nn = (node_t *)malloc(sizeof(node_t));
	nn->gen = gen;
	nn->index = index;
	nn->next = NULL;
	nn->spawn = NULL;
	return nn;
}
int main()
{
	readsf(fopen("file.sf2", "rb"));
	node_t *start = NULL;
	for (int i = 0; i < nphdrs - 1; i++)
	{
		node_t *pdn = newNode(NULL, phdrs[i].pid);
		insert(&start, pd);
		pbag *pbagd = pbags + phdrs[i].pbagNdx;
		zone_t *pbagz = (zone_t *)pgens + pbagd->pgen_id;
		int lastbag = phdrs[i + 1].pbagNdx;
		int instID = -1;
		for (int j = phdrs[i].pbagNdx; j < phdrs[i + 1].pbagNdx; j++)
		{
			pbag *pg = pbags + j;

			while (pg !=)
				pgen_t *lastg = pgens + pg[j + 1].pgen_id;
			int pgenId = pg->pgen_id;
			int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
			short pgset[60] = {-1};
			for (int k = pgenId; k < lastPgenId; k++)
			{
				pgen_t *g = pgens + k;

				if (g->operator== 41)
				{
					instID = g->val.uAmount;
				}
				pgset[g->operator] = g->val.shAmount;
			}
		}
	}
}

zone_t *get_sf(int pid, int bkid, int key, int vel)
{
	zone_t *head = NULL;
	zone_t **z = &head;
	short *attributes;
	short igset[60] = {-1};
	int instID = -1;
	int lastSampId = -1;
	short pgdef[60] = {-1};
	for (int i = 0; i < nphdrs - 1; i++)
	{
		int lastbag = phdrs[i + 1].pbagNdx;
		pbag *presets = NULL;
		pbag **tr = &presets;

		for (int j = phdrs[i].pbagNdx; j < lastbag; j++)
		{
			pbag *pg = pbags + j;
			pgen_t *lastg = pgens + pg[j + 1].pgen_id;
			int pgenId = pg->pgen_id;
			int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
			short pgset[60] = {-1};
			instID = -1;
			for (int k = pgenId; k < lastPgenId; k++)
			{
				pgen_t *g = pgens + k;

				if (g->operator== 41)
				{
					instID = g->val.uAmount;
				}
				pgset[g->operator] = g->val.shAmount;
			}
			if (instID == -1)
			{
				memcpy(pgdef, pgset, sizeof(pgset));
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
						*z++ = (zone_t *)attributes;
					}
				}
			}
		}
	}
	//return head;
	return head;
}