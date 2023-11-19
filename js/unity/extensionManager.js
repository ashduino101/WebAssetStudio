import {AudioClipExtension} from "./classExtensions/audioClip";
import {FontExtension} from "./classExtensions/font";
import {MaterialExtension} from "./classExtensions/material";
import {MonoScriptExtension} from "./classExtensions/monoScript";
import {TextAssetExtension} from "./classExtensions/textAsset";
import {TransformExtension} from "./classExtensions/transform";
import {VideoClipExtension} from "./classExtensions/videoClip";
import {Extension} from "./extension";
import {Texture2DExtension} from "./classExtensions/texture2d";
import {MeshExtension} from "./classExtensions/mesh";

const EXTENSIONS = {
  83: AudioClipExtension,
  128: FontExtension,
  21: MaterialExtension,
  43: MeshExtension,
  115: MonoScriptExtension,
  49: TextAssetExtension,
  28: Texture2DExtension,
  4: TransformExtension,
  329: VideoClipExtension
}

export class ExtensionManager {
  constructor() {
  }

  getExtension(object) {
    const extClass = EXTENSIONS[object.classID] ?? Extension;
    return new extClass(
      object.object,
      object._unityVersion.replaceAll(/\D/g, '.').split('.').map(Number),
      object._targetPlatform
    );
  }

  async getPreview(object) {
    return await this.getExtension(object).createPreview();
  }

  async getExport(object) {
    return await this.getExtension(object).getExport();
  }
}