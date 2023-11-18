// Wrapper around the Texture2D WASM module.

import loadT2D from "./texture2d_native";

let T2D;

async function initT2D() {
  if (T2D == null) {
    T2D = await loadT2D();
  }
}

async function _mallocWithData(data) {
  await initT2D();
  let dataPtr = T2D._malloc(data.length * data.BYTES_PER_ELEMENT);
  T2D.HEAPU8.set(data, dataPtr);
  return dataPtr;
}

async function _decodeGeneric(wrapped, data, width, height, ...args) {
  await initT2D();
  let inOffset = await _mallocWithData(data);
  let outOffset = T2D._malloc(width * height * 4);

  T2D[wrapped](inOffset, width, height, outOffset, ...args);
  let outData = T2D.HEAPU8.slice(outOffset, outOffset + width * height * 4);
  T2D._free(inOffset);
  T2D._free(outOffset);
  return outData;
}

export const decodeDXT1 = async (d, w, h) => await _decodeGeneric('_DecodeDXT1', d, w, h);
export const decodeDXT5 = async (d, w, h) => await _decodeGeneric('_DecodeDXT5', d, w, h);
export const decodePVRTC = async (d, w, h, is2bpp) => await _decodeGeneric('_DecodePVRTC', d, w, h, is2bpp);
export const decodeETC1 = async (d, w, h) => await _decodeGeneric('_DecodeETC1', d, w, h);
export const decodeETC2 = async (d, w, h) => await _decodeGeneric('_DecodeETC2', d, w, h);
export const decodeETC2A1 = async (d, w, h) => await _decodeGeneric('_DecodeETC2A1', d, w, h);
export const decodeETC2A8 = async (d, w, h) => await _decodeGeneric('_DecodeETC2A8', d, w, h);
export const decodeEACR = async (d, w, h) => await _decodeGeneric('_DecodeEACR', d, w, h);
export const decodeEACRSigned = async (d, w, h) => await _decodeGeneric('_DecodeEACRSigned', d, w, h);
export const decodeEACRG = async (d, w, h) => await _decodeGeneric('_DecodeEACRG', d, w, h);
export const decodeEACRGSigned = async (d, w, h) => await _decodeGeneric('_DecodeEACRGSigned', d, w, h);
export const decodeBC4 = async (d, w, h) => await _decodeGeneric('_DecodeBC4', d, w, h);
export const decodeBC5 = async (d, w, h) => await _decodeGeneric('_DecodeBC5', d, w, h);
export const decodeBC6 = async (d, w, h) => await _decodeGeneric('_DecodeBC6', d, w, h);
export const decodeBC7 = async (d, w, h) => await _decodeGeneric('_DecodeBC7', d, w, h);
export const decodeATCRGB4 = async (d, w, h) => await _decodeGeneric('_DecodeATCRGB4', d, w, h);
export const decodeATCRGBA8 = async (d, w, h) => await _decodeGeneric('_DecodeATCRGBA8', d, w, h);
export const decodeASTC = async (d, w, h, bw, bh) => {
  await initT2D();
  let inOffset = await _mallocWithData(d);
  let outOffset = T2D._malloc(w * h * 4);
  T2D._DecodeASTC(inOffset, w, h, bw, bh, outOffset);
  let outData = T2D.HEAPU8.slice(outOffset, outOffset + w * h * 4);
  T2D._free(inOffset);
  T2D._free(outOffset);
  return outData;
}

export const unpackCrunch = async data => {
  await initT2D();
  let inOffset = await _mallocWithData(data);
  let outOffset = T2D._malloc(4);  // 1 pointer (we only support 1 face)
  let outputSize = T2D._malloc(4);
  T2D._UnpackCrunch(inOffset, data.length, outOffset, outputSize);
  let outPtr = new DataView(T2D.HEAPU8.slice(outOffset, outOffset + 4).buffer).getUint32(0, true);
  let dataSize = new DataView(T2D.HEAPU8.slice(outputSize, outputSize + 4).buffer).getUint32(0, true);
  let outData = T2D.HEAPU8.slice(outPtr, outPtr + dataSize);
  T2D._free(inOffset);
  T2D._free(outOffset);
  T2D._free(outputSize);
  return outData;
}
export const unpackUnityCrunch = async data => {
  await initT2D();
  let inOffset = await _mallocWithData(data);
  let outOffset = T2D._malloc(4);  // 1 pointer (we only support 1 face)
  let outputSize = T2D._malloc(4);
  T2D._UnpackUnityCrunch(inOffset, data.length, outOffset, outputSize);
  let outPtr = new DataView(T2D.HEAPU8.slice(outOffset, outOffset + 4).buffer).getUint32(0, true);
  let dataSize = new DataView(T2D.HEAPU8.slice(outputSize, outputSize + 4).buffer).getUint32(0, true);
  let outData = T2D.HEAPU8.slice(outPtr, outPtr + dataSize);
  T2D._free(inOffset);
  T2D._free(outOffset);
  T2D._free(outputSize);
  return outData;
}
