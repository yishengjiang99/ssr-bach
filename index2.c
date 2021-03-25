#include <stdio.h>
#include <stdlib.h>
#include <strings.h>
#include <unistd.h>

#include "index.h"
int main(int argc, char **argv)
{

	unsigned int size, size2L;

	printf("\nd %d", argc);

	int c;
	char *filename = argc > 1 ? argv[1] : "file.sf2";
	char *dbname = argc > 2 ? argv[2] : "grepsf23";
	FILE *fd = fopen(filename, "r");
	FILE *mysql, *debug, *rmysql;
	debug = fopen("debug.sql", "w+");
	mysql = popen("mysql -u root", "w");
	fprintf(mysql, "drop database if exists %s; create database %s;", dbname, dbname);

	fprintf(mysql, "use %s; source sf2.sql;source sf22.sql;", dbname);

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
	printf("%.4s:%u\n", sh->name, sh->size);
	npresets = sh->size / sizeof(phdr);
	phdr *phdrs = (phdr *)malloc(sh->size);
	fread(phdrs, sizeof(phdr), sh->size / sizeof(phdr), fd);
	for (int i = 0; i < npresets; i++)
	{
		fprintf(mysql, "insert ignore into phdr values (%d,'hold',%u,%u);", (phdrs + i)->bagNdx, (phdrs + i)->name, (phdrs + i)->bankId, (phdrs + i)->pbagNdx);
	}
	FILE *rd = popen("mysql -u root grepsf2 -e 'select * from phdr'", "r");
	while (c = fgetc(rd) != EOF)
	{
		putchar(c);
	}

	fread(sh, sizeof(section_header), 1, fd);
	printf("%.4s:%u\n", sh->name, sh->size);
	npbags = sh->size / sizeof(pbag);
	pbag *pbags = (pbag *)malloc(sh->size);
	fread(pbags, sizeof(pbag), sh->size / sizeof(pbag), fd);
	for (int i = 0; i < npbags; i++)
	{
		fprintf(mysql, "\ninsert ignore into pbag values (%d, %u,%u);", i, (pbags + i)->pgen_id, (pbags + i)->pmod_id); //, (phdrs + i)->bankId, (phdrs + i)->pbagNdx);
	}

	fread(sh, sizeof(section_header), 1, fd);
	printf("%.4s:%u\n", sh->name, sh->size);
	npmods = sh->size / sizeof(pmod);
	pmod *pmods = (pmod *)malloc(sh->size);
	fread(pmods, sizeof(pmod), sh->size / sizeof(pmod), fd);

	for (int i = 0; i < npmods; i++)
	{
	}

	fread(sh, sizeof(section_header), 1, fd);
	printf("%.4s:%u\n", sh->name, sh->size);
	npgens = sh->size / sizeof(pgen_t);
	pgen_t *pgens = (pgen_t *)malloc(sh->size);
	fread(pgens, sizeof(pgen_t), sh->size / sizeof(pgen_t), fd);
	for (int i = 0; i < npgens; i++)
	{
		fprintf(mysql, "insert ignore into pgen (id,operator,lo,hi,amount) values (%d, %hu,%hu,%hu,%d);", i, (pgens + i)->operator,(pgens + i)->val.ranges.lo, (pgens + i)->val.ranges.hi, (pgens + i)->val.shAmount); //, (phdrs + i)->bankId, (phdrs + i)->pbagNdx);
	}

	fread(sh, sizeof(section_header), 1, fd);
	printf("%.4s:%u\n", sh->name, sh->size);
	ninst = sh->size / sizeof(pgen_t);
	inst *insts = (inst *)malloc(sh->size);
	fread(insts, sizeof(inst), sh->size / sizeof(inst), fd);
	for (int i = 0; i < ninst; i++)
	{
		inst *ii = (insts + i);

		fprintf(mysql, "insert into inst ( id, ibag_id) value ");

		fprintf(mysql, "(%d, %hu);", i, ii->ibagNdx);
	}
	fread(sh, sizeof(section_header), 1, fd);
	nibags = sh->size / sizeof(ibag);
	printf("%.4s:%u %u\n", sh->name, sh->size, nibags);
	ibag *ibags = (ibag *)malloc(sh->size);
	fread(ibags, sizeof(ibag), sh->size / sizeof(ibag), fd);
	for (int i = 0; i < nibags; i++)
	{
		fprintf(mysql, "insert ignore into ibag values (%d,%hu,%hu);", i, (ibags + i)->igen_id, (ibags + i)->imod_id); //", (pgens + i)->operator,(pgens + i)->val.ranges.lo, (pgens + i)->val.ranges.hi); //, (phdrs + i)->bankId, (phdrs + i)->pbagNdx);
	}

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
	for (int i = 0; i < nigens - 1; i++)
	{
		//("%d", i);
		fprintf(mysql, "\ninsert ignore into igen (id,operator,lo,hi,amount) values (%d, %hu, %hu, %hu,%d);",
				i, (igens + i)->operator,(igens + i)->val.ranges.lo, (igens + i)->val.ranges.hi, (igens + i)->val.shAmount); //, (phdrs + i)->bankId, (phdrs + i)->pbagNdx);
																															 //printf("%d", i);
	}
	fread(sh, sizeof(section_header), 1, fd);
	printf("%.4s:%u\n", sh->name, sh->size);
	nshdrs = sh->size / sizeof(shdr);
	shdr *shdrs = (shdr *)malloc(sh->size);
	fread(shdrs, sizeof(shdr), sh->size / sizeof(shdr), fd);

	pclose(fd);
}
static void safe_sql_str(FILE *file, int size, FILE *output)
{
	fputc('\'', output);
	for (int ci = 0; ci < size; ci++)
	{
		int c = fgetc(file);
		if (c == 20 || c >= 60 && c <= 122)
			fputc(c, output);
	}
	fputc('\'', output);
}