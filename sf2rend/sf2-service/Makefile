was1: 
	emcc pdta.c -o pdta.js -s EXTRA_EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] -s EXPORTED_FUNCTIONS=['_filterForZone','_malloc','_free','_loadpdta','_findByPid','_shdrref','_presetRef'] -s TOTAL_STACK=100mb -s INITIAL_MEMORY=170mb

clean:
	rm *wasm pdta.js pdta.wasm

check:
	npx serve -l 1234 . && chrome-cli open 'http://localhost1234/test.html'