import { SF2File } from './sffile';

const {sections:{pdta}}=new SF2File('./file.sf2');
console.log(pdta.presets[0][0]);
