import {BasicStream} from "./stream";
import LZMA from "../vendor/lzma";
import ClassIDType from "./classIDType";

export function compareFilter(op, a, b) {
  switch (op) {
    case '==':
      return a === b;
    case '!=':
      return a !== b;
    case '<':
      return a < b;
    case '<=':
      return a <= b;
    case '>':
      return a > b;
    case '>=':
      return a >= b;
  }
  return false;
}

export const lzmaDecompress = function (data, rawSize) {
  let dec = new LZMA.Decoder();
  let stream = new BasicStream(data);
  let props = stream.readByte();
  let lc = props % 9;
  let rem = props / 9;
  let lp = (rem % 5) | 0;
  let pb = (rem / 5) | 0;
  if (pb > 4) {
    throw new Error('`pb` too high in LZMA properties');
  }
  let dictSize = 0;
  for (let i = 0; i < 4; i++) {
    dictSize |= stream.readByte() << (i * 8);
  }
  dec.setLcLpPb(lc, lp, pb);
  dec.setDictionarySize(dictSize);

  let outStream = new BasicStream(null, rawSize + 1);  // the decoder prepends a byte for some reason

  dec.decode(stream, outStream, rawSize);
  return outStream.data.slice(1, outStream.data.length);  // remove extra byte
}

export async function requestExternalData(streamingInfo) {
  return new Promise((resolve, reject) => {
    const listener = result => {
      document.body.removeEventListener('bundle-resolve-response', listener);
      if (result.detail.status) {
        let outData = result.detail.data.slice(
          streamingInfo.offset,
          streamingInfo.offset + (
            (streamingInfo.size === -1) ? result.detail.data.length : streamingInfo.size
          )
        );
        resolve(outData);
      } else {
        reject('Failed to resolve external image data');
      }
    }
    document.body.addEventListener('bundle-resolve-response', listener);
    document.body.dispatchEvent(new CustomEvent('bundle-resolve-request', {detail: streamingInfo.path}));
  });
}

export function getClassName(classID) {
  let ct = ClassIDType[classID];
  if (ct instanceof Array) {
    return ct[0];
  }
  return ct;
}
