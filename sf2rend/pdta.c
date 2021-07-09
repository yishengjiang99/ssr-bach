#include <string.h>
#include  <stdlib.h>
#include "sf2.h"

extern float powf(float b, float exp);
extern float sqrtf(float x);

extern void perror(char *msg);
void loadpdta(void *pdtabuffer) {
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
    presetZones = (PresetZones *)malloc(nphdrs * sizeof(PresetZones));
  for (int i = 0; i < nphdrs; i++) {
    *(presetZones + i) = findPresetZones(i, findPresetZonesCount(i));
  }
}
typedef struct {
  int lokey, hikey, lovel, hive;
} filter_t;
typedef struct {
  rangesType vel, key;
  pgen_t *gen;
} genlist;

typedef struct {
  int pid, bkid;
  genlist *pgenList;
  genlist *igenList;
} preset;
PresetZones *findByPid(int pid, int bkid) {
  for (unsigned short i = 0; i < nphdrs - 1; i++) {
    if (phdrs[i].pid == pid && phdrs[i].bankId == bkid) {
      return presetZones + pid;
    }
  }

  return presetZones;
}
void sanitizedInsert(short *attrs, int i, pgen_t *g) {
  switch (i % 60) {
    case StartAddrOfs:
    case EndAddrOfs:
    case StartLoopAddrOfs:
    case EndLoopAddrOfs:
    case StartAddrCoarseOfs:
    case EndAddrCoarseOfs:
    case StartLoopAddrCoarseOfs:
    case EndLoopAddrCoarseOfs:
    case OverrideRootKey:
      attrs[i] = g->val.uAmount & 0x7f;
      break;
    default:
      attrs[i] = g->val.shAmount;
      break;
  }
}
int findPresetZonesCount(int i) {
  int nregions = 0;
  int instID = -1, lastSampId = -1;
  phdr phr = phdrs[i];
  for (int j = phr.pbagNdx; j < phdrs[i + 1].pbagNdx; j++) {
    pbag *pg = pbags + j;
    pgen_t *lastg = pgens + pg[j + 1].pgen_id;
    int pgenId = pg->pgen_id;
    instID = -1;
    int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
    for (int k = pgenId; k < lastPgenId; k++) {
      pgen *g = pgens + k;
      if (g->genid == Instrument) {
        instID = g->val.shAmount;
        lastSampId = -1;
        inst *ihead = insts + instID;
        int ibgId = ihead->ibagNdx;
        int lastibg = (ihead + 1)->ibagNdx;
        for (int ibg = ibgId; ibg < lastibg; ibg++) {
          lastSampId = -1;
          ibag *ibgg = ibags + ibg;
          pgen_t *lastig = ibg < nibags - 1 ? igens + (ibgg + 1)->igen_id
                                            : igens + nigens - 1;
          for (pgen_t *g = igens + ibgg->igen_id; g->genid != 60 && g != lastig;
               g++) {
            if (g->genid == SampleId) {
              nregions++;
            }
          }
        }
      }
    }
  }
  return nregions;
}
PresetZones findPresetZones(int i, int nregions) {
  short defvals[60] = defattrs;

  enum {
    default_pbg_cache_index = 0,
    pbg_attr_cache_index = 60,
    default_ibagcache_idex = 120,
    ibg_attr_cache_index = 180
  };
  zone_t *zones = (zone_t *)malloc(nregions * sizeof(zone_t));
  int found = 0;
  short attrs[240] = {0};
  int instID = -1;
  int lastbag = phdrs[i + 1].pbagNdx;
  bzero(&attrs[default_pbg_cache_index], 240 * sizeof(short));
  memcpy(attrs, defvals, 2 * 60);
  memcpy(attrs + pbg_attr_cache_index, defvals, 2 * 60);

  for (int j = phdrs[i].pbagNdx; j < phdrs[i + 1].pbagNdx; j++) {
    int attr_inex =
        j == phdrs[i].pbagNdx ? default_pbg_cache_index : pbg_attr_cache_index;
    bzero(&attrs[pbg_attr_cache_index], 180 * sizeof(short));
    memcpy(attrs + pbg_attr_cache_index, defvals, 2 * 60);

    pbag *pg = pbags + j;
    pgen_t *lastg = pgens + pg[j + 1].pgen_id;
    int pgenId = pg->pgen_id;
    int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
    attrs[Unused1 + pbg_attr_cache_index] = j;
    for (int k = pgenId; k < lastPgenId; k++) {
      pgen *g = pgens + k;
      if (g->genid != Instrument) {
        sanitizedInsert(attrs, g->genid + attr_inex, g);
      } else {
        instID = g->val.shAmount;
        sanitizedInsert(attrs, g->genid + attr_inex, g);
        bzero(&attrs[default_ibagcache_idex], 120 * sizeof(short));
        memcpy(attrs + default_ibagcache_idex, defvals, 2 * 60);

        int lastSampId = -1;
        inst *ihead = insts + instID;
        int ibgId = ihead->ibagNdx;
        int lastibg = (ihead + 1)->ibagNdx;
        for (int ibg = ibgId; ibg < lastibg; ibg++) {
          bzero((&attrs[0] + ibg_attr_cache_index), 60 * sizeof(short));
          memcpy(attrs + ibg_attr_cache_index, defvals, 2 * 60);

          attr_inex =
              ibg == ibgId ? default_ibagcache_idex : ibg_attr_cache_index;
          lastSampId = -1;
          ibag *ibgg = ibags + ibg;
          attrs[Unused2 + default_ibagcache_idex] = ibg;

          pgen_t *lastig = ibg < nibags - 1 ? igens + (ibgg + 1)->igen_id
                                            : igens + nigens - 1;

          for (pgen_t *g = igens + ibgg->igen_id; g->genid != 60 && g != lastig;
               g++) {
            sanitizedInsert(attrs, attr_inex + g->genid, g);

            if (g->genid == SampleId) {
              short zoneattr[60] = defattrs;
              int add = 1;
              lastSampId = g->val.shAmount;  // | (ig->val.ranges.hi << 8);
              for (int i = 0; i < 60; i++) {
                if (attrs[ibg_attr_cache_index + i]) {
                  zoneattr[i] = attrs[ibg_attr_cache_index + i];
                } else if (attrs[default_ibagcache_idex + i]) {
                  zoneattr[i] = attrs[default_ibagcache_idex + i];
                }
                short pbagAttr = attrs[pbg_attr_cache_index + i];

                if (i == VelRange || i == KeyRange) {
                  int irange[2] = {zoneattr[i] & 0x007f, zoneattr[i] >> 8};
                  int prange[2] = {pbagAttr & 0x007f, pbagAttr >> 8};
                  if (prange[0] > irange[1] || prange[1] < irange[0]) {
                    add = 0;

                    break;
                  }
                  if (prange[1] < irange[1]) irange[1] = prange[1];

                  if (prange[0] > irange[0]) irange[0] = prange[0];

                  zoneattr[i] = irange[0] | (irange[1] << 8);
                } else {
                  if (attrs[pbg_attr_cache_index + i] != defvals[i]) {
                    zoneattr[i] +=
                        attrs[pbg_attr_cache_index + i];  // - defvals[i];
                  } else if (attrs[default_pbg_cache_index + i] != defvals[i]) {
                    zoneattr[i] +=
                        attrs[default_pbg_cache_index + i];  // - defvals[i];
                  }
                }
              }
              if (add) {
                memcpy(zones + found, zoneattr, 60 * sizeof(short));
                found++;
              } else {
              }
            }
          }
        }
      }
    }
  }
  return (PresetZones){phdrs[i], found, zones};
}
zone_t *filterForZone(PresetZones *pset, int key, int vel) {

  for (int i = 0; i < pset->npresets; i++) {
    zone_t *z = pset->zones + i;
    if (z == 0) break;
    if (vel > -1 && (z->VelRange.lo > vel || z->VelRange.hi < vel)) continue;
    if (key > -1 && (z->KeyRange.lo > key || z->KeyRange.hi < key)) continue;
    return z;
  }
  if (vel > 0) return filterForZone(pset, key, -1);
  if (key > 0) return filterForZone(pset, -1, vel);
  return &pset->zones[0];
}
