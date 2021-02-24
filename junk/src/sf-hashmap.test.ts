import { Midi } from '@tonejs/midi';
import { readFile, readFileSync } from 'fs';
import { convertMidi } from './load-sort-midi';
import { hashMapFile, hasMapBuffer }from './sf-hashmap';
let ab= readFileSync("./file.sf2");


test("hashmapfile", (done)=>{

	let {lookup, mapPreset,map} = hasMapBuffer(ab); //"./file.sf2");;
	mapPreset(0,0);
	const res=lookup(0,0, 33, 127);
	expect(res).toBeDefined();
	done();
})
test("sf for midi", (done)=>{
	let {lookup, mapPreset,map} = hasMapBuffer(ab); //"./file.sf2");;
	mapPreset(0,0);
	expect(map[0]).toBeDefined();
	done();
})
