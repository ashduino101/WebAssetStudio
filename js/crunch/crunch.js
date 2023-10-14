import loadCrunch from "./crunch_native";

let Crunch;

async function initCrunch() {
  if (Crunch == null) {
    Crunch = await loadCrunch();
  }
}

async function _mallocWithData(data) {
  await initCrunch();
  let dataPtr = Crunch._malloc(data.length * data.BYTES_PER_ELEMENT);
  Crunch.HEAPU8.set(data, dataPtr);
  return dataPtr;
}

export const unpackCrunch = async data => {
  await initCrunch();
  let inOffset = await _mallocWithData(data);
  let outOffset = Crunch._malloc(4);  // 1 pointer (we only support 1 face)
  let outputSize = Crunch._malloc(4);
  Crunch._UnpackCrunch(inOffset, data.length, outOffset, outputSize);
  let outPtr = new DataView(Crunch.HEAPU8.slice(outOffset, outOffset + 4).buffer).getUint32(0, true);
  let dataSize = new DataView(Crunch.HEAPU8.slice(outputSize, outputSize + 4).buffer).getUint32(0, true);
  let outData = Crunch.HEAPU8.slice(outPtr, outPtr + dataSize);
  Crunch._free(inOffset);
  Crunch._free(outOffset);
  Crunch._free(outputSize);
  return outData;
}
export const unpackUnityCrunch = async data => {
  await initCrunch();
  let inOffset = await _mallocWithData(data);
  let outOffset = Crunch._malloc(4);  // 1 pointer (we only support 1 face)
  let outputSize = Crunch._malloc(4);
  Crunch._UnpackUnityCrunch(inOffset, data.length, outOffset, outputSize);
  let outPtr = new DataView(Crunch.HEAPU8.slice(outOffset, outOffset + 4).buffer).getUint32(0, true);
  let dataSize = new DataView(Crunch.HEAPU8.slice(outputSize, outputSize + 4).buffer).getUint32(0, true);
  let outData = Crunch.HEAPU8.slice(outPtr, outPtr + dataSize);
  Crunch._free(inOffset);
  Crunch._free(outOffset);
  Crunch._free(outputSize);
  return outData;
}
