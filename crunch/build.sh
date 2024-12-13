# FIXME: -03 breaks our code for some reason, so we can't use optimizations
em++ crunch.cpp unitycrunch.cpp dllmain.cpp -O0 --closure 1 -o crunch_native.js -s NO_EXIT_RUNTIME=1 -s 'EXPORTED_RUNTIME_METHODS=["ccall", "cwrap"]' -s 'EXPORTED_FUNCTIONS=["_malloc", "_free", "_UnpackCrunch", "_UnpackUnityCrunch"]' -s INITIAL_HEAP=33554432 -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s EXPORT_ES6=0 -s EXPORT_NAME=loadCrunch
xz -e -T 12 -7 -vzk crunch_native.wasm
mv crunch_native.js ../src/crunch/
mv crunch_native.wasm.xz ../src/crunch/
rm crunch_native.wasm