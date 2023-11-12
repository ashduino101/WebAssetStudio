import {BasicStream} from "./stream";
import LZMA from "../vendor/lzma";
import ClassIDType from "./classIDType";
import {Transform} from "./classes/transform";
import {PPtr} from "./classes/pptr";
import {GameObject} from "./classes/gameObject";
import {UnityObject} from "./classes/object";

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

// TODO: this is absolutely terrible
function _firstPreviewable(object, traversed = new Set()) {
  if (object instanceof Transform) {
    object.mapChildren();
    for (const c of object.realChildren) {
      let [has, is] = _firstPreviewable(c, traversed);
      if (has) return [has, is];
    }
    for (const c of object.gameObject.object.components) {
      let [has, is] = _firstPreviewable(c, traversed);
      if (has) return [has, is];
    }
    return [false, null];
  } else if (object instanceof PPtr) {
    if (traversed.has(object.pathID)) return [false, null];
    if (object.object instanceof Transform) {
      object.object.mapChildren();
      traversed.add(object.pathID);
      for (const c of object.object.realChildren) {
        let [has, is] = _firstPreviewable(c, traversed);
        if (has) return [has, is];
      }
      for (const c of object.object.gameObject.object.components) {
        let [has, is] = _firstPreviewable(c, traversed);
        if (has) return [has, is];
      }
      return [false, null];
    } else {
      if (object instanceof PPtr) {
        object = object.object;
      }
      return [object.constructor.prototype.hasOwnProperty(UnityObject.prototype.createPreview.name), object];
    }
  } else if (object instanceof GameObject) {
    for (const c of object.components) {
      let [has, is] = _firstPreviewable(c, traversed);
      if (has) return [has, is];
    }
    return [false, null];
  } else {
    if (object instanceof PPtr) {
      object = object.object;
    }
    return [object.hasOwnProperty(UnityObject.prototype.createPreview.name), object];
  }
}

export function firstPreviewable(object) {
  return _firstPreviewable(object)[1];
}

export function globalDestroy() {
  console.log(`Destroying ${window._global__destroyable.length} objects`);
  if (window._global__destroyable) {
    window._global__destroyable.forEach(o => {
      if (typeof o == 'function') o();
    });
    window._global__destroyable = [];
  }
}
