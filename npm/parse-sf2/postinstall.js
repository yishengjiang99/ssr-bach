const fs = require("fs");
if (!fs.existsSync("GeneralUserGS.sf2")) {
	require("child_process").execSync(
		"curl -O 'https://grep32bit.blob.core.windows.net/sf2/GeneralUserGS.sf2'"
	);
}
