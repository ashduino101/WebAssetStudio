import {Extension} from "../extension";
import {ExtensionManager} from "../extensionManager";

export class MaterialExtension extends Extension {
  constructor(material, unityVersion, targetPlatform) {
    super();
    this.material = material;
    this.unityVersion = unityVersion;
    this.targetPlatform = targetPlatform;
  }

  getTexEnv(key) {
    let texEnv = this.material.m_SavedProperties.m_TexEnvs.filter(t => t.data.first === key)[0];
    if (texEnv) {
      let texPtr = texEnv.data.second.m_Texture;
      texPtr.resolve();
      if (texPtr.object) {
        return texPtr.object;
      }
    }
    return null
  }

  getInt(key) {
    return this.material.m_SavedProperties.m_Ints.filter(t => t.data.first === key)[0]?.data?.second ?? null;
  }

  getFloat(key) {
    return this.material.m_SavedProperties.m_Floats.filter(t => t.data.first === key)[0]?.data?.second ?? null;
  }

  getColor(key) {
    return this.material.m_SavedProperties.m_Colors.filter(t => t.data.first === key)[0]?.data?.second ?? null;
  }

  async createPreview() {
    let mainTex = this.getTexEnv('_MainTex');
    console.log(mainTex);
    console.log(this.material);
    if (mainTex) {
      return await new ExtensionManager().getPreview({
        object: mainTex,
        classID: 28,
        _unityVersion: this.unityVersion,
        _targetPlatform: this.targetPlatform
      });
    }
    return document.createElement('div');
  }
}