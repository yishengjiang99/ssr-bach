import { SF2File } from "./sffile";
import { ffp } from "./sinks";

const readline = require("readline");
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
const sff = new SF2File("file.sf2");
const keys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j", "q"];
let ch = 0;
let ff;
process.stdin.on("keypress", (str, key) => {
	const dd = key.name;
	if (dd == "q") process.exit(); //exit;
	//console.log(dd);
	const k = keys.indexOf(dd);

	if (k > -1) {
		if (!ff) {
			ff = ffp();
			setInterval(() => ff.write(sff.rend_ctx.render(256)), 7);
		}
		ch++;
		// sff.rend_ctx.keyOff(ch, 0);
		sff.rend_ctx.keyOn(k + 60, 66, 0, ch % 12);
	}
	//console.log(k, dd);
});
process.on("SIGILL", () => process.exit);
