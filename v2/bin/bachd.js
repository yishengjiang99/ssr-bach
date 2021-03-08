#!/bin/bash 
node ./dist/index.js go  > ./ffplay -nodisp -loglevel panic -f f32le -ar 48000 -ac 2 -i pipe:0
