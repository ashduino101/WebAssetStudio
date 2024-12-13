# FIXME: -03 breaks our code for some reason, so we can only use wasm-opt for optimizations
em++ crunch.cpp unitycrunch.cpp dllmain.cpp -O0 --closure 1 -o crunch_native.js -s NO_EXIT_RUNTIME=1 -s 'EXPORTED_RUNTIME_METHODS=["ccall", "cwrap"]' -s 'EXPORTED_FUNCTIONS=["_malloc", "_free", "_UnpackCrunch", "_UnpackUnityCrunch"]' -s INITIAL_HEAP=33554432 -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s EXPORT_ES6=0 -s EXPORT_NAME=loadCrunch
wasm-opt -O4 -c --enable-simd --ssa --rse -ffm --gsi --gto --dce --code-folding --post-emscripten --merge-locals --local-cse --optimize-instructions --optimize-casts --remove-unused-types --remove-unused-names --remove-unused-module-elements --remove-unused-brs --simplify-globals --simplify-locals --strip-debug --strip-eh --strip-producers --strip-target-features --type-merging --tuple-optimization --type-refining --vacuum crunch_native.wasm -o crunch_native.wasm
xz -e -T 12 -7 -vzk crunch_native.wasm
mv crunch_native.js ../src/crunch/
mv crunch_native.wasm.xz ../src/crunch/
rm crunch_native.wasm