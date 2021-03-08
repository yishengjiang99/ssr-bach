#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include <string.h>
#include <unistd.h>
static void safe_sql_str(FILE *file, int size, FILE *output);
char *generator[60] = {"Gen_StartAddrOfs", "Gen_EndAddrOfs", "Gen_StartLoopAddrOfs", "Gen_EndLoopAddrOfs", "Gen_StartAddrCoarseOfs", "Gen_ModLFO2Pitch", "Gen_VibLFO2Pitch", "Gen_ModEnv2Pitch", "Gen_FilterFc", "Gen_FilterQ", "Gen_ModLFO2FilterFc", "Gen_ModEnv2FilterFc", "Gen_EndAddrCoarseOfs", "Gen_ModLFO2Vol", "Gen_Unused1", "Gen_ChorusSend", "Gen_ReverbSend", "Gen_Pan", "Gen_Unused2", "Gen_Unused3", "Gen_Unused4", "Gen_ModLFODelay", "Gen_ModLFOFreq", "Gen_VibLFODelay", "Gen_VibLFOFreq", "Gen_ModEnvDelay", "Gen_ModEnvAttack", "Gen_ModEnvHold", "Gen_ModEnvDecay", "Gen_ModEnvSustain", "Gen_ModEnvRelease", "Gen_Key2ModEnvHold", "Gen_Key2ModEnvDecay", "Gen_VolEnvDelay", "Gen_VolEnvAttack", "Gen_VolEnvHold", "Gen_VolEnvDecay", "Gen_VolEnvSustain", "Gen_VolEnvRelease", "Gen_Key2VolEnvHold", "Gen_Key2VolEnvDecay", "Gen_Instrument", "Gen_Reserved1", "Gen_KeyRange", "Gen_VelRange", "Gen_StartLoopAddrCoarseOfs", "Gen_Keynum", "Gen_Velocity", "Gen_Attenuation", "Gen_Reserved2", "Gen_EndLoopAddrCoarseOfs", "Gen_CoarseTune", "Gen_FineTune", "Gen_SampleId", "Gen_SampleModes", "Gen_Reserved3", "Gen_ScaleTune", "Gen_ExclusiveClass", "Gen_OverrideRootKey", "Gen_Dummy"};

static uint16_t read16(FILE *file) { return fgetc(file) | (fgetc(file) << 8); }
static uint32_t read32(FILE *file) { return fgetc(file) | (fgetc(file) << 8) | (fgetc(file) >> 16) | fgetc(file) << 24; } // | (fgetc(file) << 16) | (fgetc(file) << 8) | fgetc(file); }
int main(int argc, char **argv)
{

	char riff[4];
	unsigned int size, size2L;
	char name[20];
	char idc[12];
	FILE *mysql, *debug;
	int presetNum;
	uint16_t *pbagIndices;

	char *filename = argc > 1 ? argv[1] : "file.sf2";
	char *dbname = argc > 2 ? argv[2] : "grepsf2";

	printf("loading %s to %s", filename, dbname);
	// execl("mysql -u root groupmidi -e '%s'", "alter table pbag add preset_id smallint unsigned");

	FILE *file = fopen(filename, "rb");

	fread(riff, 4, 1, file);
	printf("\n%.4s", riff);
	fread(&size, 1, 4, file);
	printf("\n%u", size);
	fread(riff, 4, 1, file);
	printf("\n%.4s", riff);
	fread(riff, 4, 1, file);
	printf("\n%.4s", riff);

	fread(&size, 1, 4, file);
	printf("\n%u", size);
	fread(riff, 4, 1, file);
	printf("\n%.4s", riff);
	fseek(file, size, SEEK_CUR);

	fread(&size, 1, 4, file);
	printf("\n%u", size);
	fread(riff, 4, 1, file);
	printf("\n%.4s", riff);
	fseek(file, size, SEEK_CUR);

	fread(&size, 1, 4, file);
	printf("\n%u", size);
	fread(riff, 4, 1, file);
	printf("\n%.4s", riff);

	fread(riff, 4, 1, file);
	printf("\n%.4s", riff);
	//	assert(strcmp(riff,"pdta")==0);

	fread(&size, 1, 4, file);
	printf("\n%u kk", size);
	// execl("mysql -u root groupmidi < sf2.sql", "");
	mysql = popen("mysql -u root", "w");
	fprintf(mysql, "use %s;", "groupmidi");
	debug = popen("cat", "w");
	presetNum = size / 38;

	pbagIndices = malloc(sizeof(int) * presetNum);
	typedef struct phdr_t
	{
		uint16_t id, pbagIndex, bankId;
	} phdr_t;

	phdr_t *list = (phdr_t *)malloc(presetNum * sizeof(phdr_t));
	phdr_t *cur = list;

	for (int i = 0; i < size; i += 38)
	{
		fprintf(mysql, "\n insert ignore into phdr (name, id, bank_id, pbag_id) values ");
		fputc('(', mysql);
		safe_sql_str(file, 20, mysql);
		fputc(',', mysql);
		cur->id = read16(file);
		cur->bankId = read16(file);
		cur->pbagIndex = read16(file);
		fprintf(mysql, "%hu, %hu, %hu);", cur->id, cur->bankId, cur->pbagIndex); // , read16(file), read16(file));
		cur++;
		fseek(file, 12, SEEK_CUR);
	}

	fread(riff, 4, 1, file);
	fread(&size, 1, 4, file);

	typedef struct pbag
	{
		uint16_t id, pgenId, pmodId, presetId;
	} pbag_t;
	int pbagNum = size / 4;

	pbag_t *listbag = (pbag_t *)malloc(pbagNum * sizeof(pbag_t));
	pbag_t *pbag_cursor = listbag;
	int presetId;
	for (int i = 0; i < size / 4; i++)
	{
		if (i <= (list + 1)->pbagIndex)
		{
			presetId = list->id;
		}
		else
		{
			list++;
			presetId = list->id;
		}
		pbag_cursor->id = i;
		pbag_cursor->pgenId = read16(file);
		pbag_cursor->pmodId = read16(file);
		pbag_cursor->presetId = presetId;

		//= (pbag_t *){i, read16(file), read16(file), presetId};

		fprintf(mysql, "\ninsert ignore into pbag (id, pgen_id, pmod_id, preset_id) values ");
		fprintf(mysql, " (%i, %hu, %hu, %d); ", pbag_cursor->id, pbag_cursor->pgenId, pbag_cursor->pmodId, presetId);
	}
	printf("---%lu", ftell(file));

	fread(riff, 4, 1, file);
	fread(&size, 1, 4, file);
	printf("\n%.4s %u", riff, size);
	return 1;

	fprintf(mysql, "\ninsert ignore into pmod(id, mod_src, mod_dest, mod_amt, mod_amt_src, transpose) values "); //mod src, mod dest, mod amount, mod amt, src mod, transope");
	for (int i = 0; i < size / 10; i++)
	{
		fprintf(mysql, "(%i,%u,%u,%u,%u,%u),", i, read16(file), read16(file), read16(file), read16(file), read16(file));
	}
	fprintf(mysql, "(-1,0,0,0,0,0);");

	fread(riff, 4, 1, file);
	fread(&size, 1, 4, file);
	printf("%.4s %u", riff, size);
	for (int i = 0; i < size / 4; i++)
	{
		uint16_t pbagId = i >= (listbag + 1).pgenId && listbag++ ? listbag->id : listbag->id; //.id;
		fprintf(mysql, "\ninsert ignore into pgen(id,operator,lo,hi, pbagId) values ");
		fprintf(mysql, "(%i, %hu, %d, %d, hu);", i, read16(file), fgetc(file), fgetc(file), pbagId);
	}

	fread(riff, 4, 1, file);
	printf("\n%.4s", riff);
	fread(&size, 1, 4, file);
	printf("\n%u", size);

	for (int i = 0; i < size / 22; i++)
	{

		fprintf(mysql, "insert into inst (name, id, ibag_id) value ");
		fputc('(', mysql);
		safe_sql_str(file, 20, mysql);
		fputc(',', mysql);
		fprintf(mysql, "%i, %u);", i, read16(file));
	}

	fread(riff, 4, 1, file);
	printf("\n%.4s", riff);
	fread(&size, 1, 4, file);
	printf("\n%u", size);
	for (int i = 0; i < size / 4; i++)
	{
		fprintf(mysql, " insert into ibag (id, igen_id, imod_id) values "); //, id, bankid, presetBagIndex) values ");

		fprintf(mysql, " (%i, %u, %u );", i, read16(file), read16(file));
	}

	fread(riff, 4, 1, file);
	printf("\n%.4s", riff);
	fread(&size, 1, 4, file);
	printf("\n%u", size);

	for (int i = 0; i < size / 10; i++)
	{
		fprintf(mysql, "\ninsert into imod(id, mod_src, mod_dest, mod_amt, mod_amt_src, transpose) values "); //mod src, mod dest, mod amount, mod amt, src mod, transope");

		fprintf(mysql, "(%i,%u,%u,%u,%u,%u);", i, read16(file), read16(file), read16(file), read16(file), read16(file));
	}

	fread(riff, 4, 1, file);
	printf("\n%.4s", riff);
	fread(&size, 1, 4, file);
	printf("\n%u", size);

	for (int i = 0; i < size / 4; i++)
	{
		fprintf(mysql, "\ninsert into igen (id,operator,lo,hi) values ");
		fprintf(mysql, " (%d, %d, %i, %i); ", i, read16(file), fgetc(file), fgetc(file));
	}

	fread(riff, 4, 1, file);
	printf("\n%.4s", riff);
	fread(&size, 1, 4, file);
	printf("\n%u", size);

	for (int i = 0; i < size; i += (20 + 4 * 5 + 1 + 1 + 4))
	{
		fprintf(mysql, "insert into shdr (start,end,startLoop,endLoop,sampleRate,originalPitch,pitchCorrection,sampleLink,sampleType) values ");

		fread(name, 20, 1, file);
		fprintf(mysql, "(%u,%u,%u,%u,%u,", read32(file), read32(file), read32(file), read32(file), read32(file));
		fprintf(mysql, "%i,%i,%d,%d);", fgetc(file), fgetc(file), read16(file), read16(file));
		if (name[0] == 'E' && name[1] == 'O' && name[2] == 'S')
		{
			break;
		}
	}

	pclose(mysql);
	return 0;
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