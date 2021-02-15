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
test("stres ", (done)=>{
	let {lookup, mapPreset,map,serielize} = hasMapBuffer(ab); //"./file.sf2");;

	const rc=convertMidi("./scripts/c.mid");
	rc.state.tracks.forEach(t=>{
		t.instrument.percussion==true ? mapPreset(255, t.instrument.number) : mapPreset(0, t.instrument.number);
	})
	

	rc.setCallback(async (notes)=>{
		notes.map(note=>{
			const notesHeader = note.instrument.percussion ==true ? lookup(255, note.instrument.number, note.midi, note.velocity) :
			lookup(0, note.instrument.number, note.midi, note.velocity);

			
			const dv= ab.slice(notesHeader.start*2, notesHeader.end*2);
			for(let i = 0; i< dv.byteLength-2; i+=2){
				const d=dv.readInt16LE(i);
				expect(d).toBeLessThanOrEqual(0x7fff);
			}
		});
		return 1;
	})
	rc.start();
	rc.emitter.once("end", done)
})