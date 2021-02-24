import { readFile, readFileSync } from 'fs';
import { GeneratorType, SoundFont2 } from 'SoundFont2';
import { keyMap, velMap } from './velMap';

export const hashMapFile = (path:string)=>{
	const ab= readFileSync(path);
	if(!ab) throw 'no file ';
	return 	hasMapBuffer(ab);
}	

export const hasMapBuffer = (buffer: Buffer) => {
  const smplStart = buffer.indexOf("sdtasmpl");
  const sf = SoundFont2.from( Uint8Array.from(buffer)); //(buffer);

  const adsrgen = [GeneratorType.AttackVolEnv, GeneratorType.ReleaseVolEnv, GeneratorType.SustainVolEnv, GeneratorType.DecayVolEnv]
  let  map: any = {};// { 0: {}, 9: {} };
  let ranges = [];
  let adsrdefaults = [-12000, -12000, 1000, -12000];
  const keymapUniq = new Set(keyMap)
  const velMapUniq = new Set(velMap);

  let mapKeyRange = (bankId, presetId,keyRange,velRange,info)=>{

    keymapUniq.forEach((k)=>{
      if(k<=keyRange.hi && k>=keyRange.lo){
        map[bankId][presetId][k] =   map[bankId][presetId][k] === null || {};
        velMapUniq.forEach(v=>{
          if(v<=velRange.hi && v>=velRange.lo){
            map[bankId][presetId][k][v] =info; //   map[bankId][presetId][k] || {};
          }
        })    
      }
    })
  }

  const mapPreset=(bankId:number, presetId:number)=> {
    map[bankId]=map[bankId]||{};
    map[bankId][presetId] = map[bankId][presetId] || {};
    const p = sf.banks[bankId].presets[presetId];
    for (const z of p.zones)
    {
      let keyRange = { lo: 0, hi: 127 }, velRange = { lo: 0, hi: 127 };

      if (z.generators[GeneratorType.VelRange]) velRange = z.generators[GeneratorType.VelRange]!.range;
      if (z.generators[GeneratorType.KeyRange]) keyRange = z.generators[GeneratorType.KeyRange]!.range;
      for (const zone of z.instrument.zones)
      {
        if (zone.generators[GeneratorType.VelRange]) velRange = zone.generators[GeneratorType.VelRange]!.range;
        if (zone.generators[GeneratorType.KeyRange]) keyRange = zone.generators[GeneratorType.KeyRange]!.range;
        const { start, end, startLoop, endLoop, originalPitch, sampleRate } = zone.sample.header;
        const adsr = adsrgen.map((gen,i) => zone.generators[gen]?.amount || z.generators[gen]?.amount || adsrdefaults[i]);
        mapKeyRange(bankId,presetId, keyRange, velRange, {keyRange, velRange, start, end, startLoop, endLoop, originalPitch, sampleRate,adsr});
      }
    }
  }
  const lookup= (bankId:number, presetId:number, key:number,vel:number)=>{
    if(vel<=1) vel = vel*0x7f;
    if(!map[bankId]|| !map[bankId][keyMap[key]] || map[bankId][keyMap[key]][velMap[vel]]){
      mapPreset(bankId, presetId);
    }
    const slice = map[bankId][presetId][keyMap[key]] || map[bankId][presetId][60];
    return slice[velMap[vel]]
  }

  return {
    map,
    smplStart,
    mapPreset,
    smplData:(bankId, presetId, note, vel)=>{
      const lkup= lookup(bankId, presetId,note, vel);
      console.log(lkup);
    },
    lookup,
    serielize:()=>JSON.stringify(map),
    fromJSON:(jsonStr:string)=>{
      map = JSON.parse(jsonStr);
    }
  }

}

const {map, lookup, mapPreset, smplData} = hasMapBuffer(readFileSync("./file.sf2"));

mapPreset(0,0);

console.log(lookup(0,0,44,102));

smplData(0,0,33,102);
smplData(0,0,32,102);
smplData(0,0,44,12);
smplData(0,0,44,111);

smplData(0,0,44,22);
smplData(0,0,44,11);
