import {AudioClipExtension} from "./classExtensions/audioClip";
import {FontExtension} from "./classExtensions/font";
import {MaterialExtension} from "./classExtensions/material";
import {MonoScriptExtension} from "./classExtensions/monoScript";
import {TextAssetExtension} from "./classExtensions/textAsset";
import {TransformExtension} from "./classExtensions/transform";
import {VideoClipExtension} from "./classExtensions/videoClip";
import {Extension} from "./extension";
import {Texture2DExtension} from "./classExtensions/texture2d";

const EXTENSIONS = {
  83: AudioClipExtension,
  128: FontExtension,
  21: MaterialExtension,
  115: MonoScriptExtension,
  49: TextAssetExtension,
  28: Texture2DExtension,
  4: TransformExtension,
  329: VideoClipExtension
}

export class ExtensionManager {
  constructor() {
  }

  async getPreview(object) {
    const extClass = EXTENSIONS[object.classID] ?? Extension;
    return await (new extClass(object.object, object._unityVersion, object._targetPlatform)).createPreview();
  }
}