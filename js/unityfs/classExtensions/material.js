import {Extension} from "../extension";

export class MaterialExtension extends Extension {
  constructor(material) {
    super();
    this.material = material;
  }

  getTexEnv(key) {
    let texEnv = this.material.m_SavedProperties.m_TexEnvs.Array.filter(t => t.data.first === key)[0];
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
    if (mainTex) {
      return await mainTex.createPreview();
    }
    return document.createElement('div');
  }
}