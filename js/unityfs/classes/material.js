import {NamedObject} from "./namedObject";
import {PPtr} from "./pptr";
import {KVPair} from "../basicTypes";

export class UnityTexEnv {
  static exposedAttributes = [
    'texture',
    'scale',
    'offset'
  ]
  constructor(reader) {
    this.texture = new PPtr(reader);
    this.scale = reader.readVector2();
    this.offset = reader.readVector2();
  }
}

export class UnityPropertySheet {
  static exposedAttributes = [
    'texEnvs',
    'ints',
    'floats',
    'colors'
  ]
  constructor(reader) {
    let numTexEnvs = reader.readInt32();
    this.texEnvs = [];
    for (let i = 0; i < numTexEnvs; i++) {
      let key = reader.readAlignedString();
      this.texEnvs.push(new KVPair(key, new UnityTexEnv(reader)));
    }

    this.ints = [];
    if (reader.version[0] >= 2021) {
      let intsSize = reader.readInt32();
      for (let i = 0; i < intsSize; i++) {
        let key = reader.readAlignedString();
        this.ints.push(new KVPair(key, reader.readInt32()));
      }
    }

    let floatsSize = reader.readInt32();
    this.floats = [];
    for (let i = 0; i < floatsSize; i++) {
      let key = reader.readAlignedString();
      this.floats.push(new KVPair(key, reader.readFloat32()));
    }

    let colorsSize = reader.readInt32();
    this.colors = [];
    for (let i = 0; i < colorsSize; i++) {
      let key = reader.readAlignedString();
      this.colors.push(new KVPair(key, reader.readColor()));
    }
  }
}

export class Material extends NamedObject {
  static exposedAttributes = [
    'name',
    'shader',
    'shaderKeywords',
    'lightmapFlags',
    'enableInstancingVariants',
    'customRenderQueue',
    'stringTagMap',
    'disabledShaderPasses',
    'savedProperties'
  ]
  constructor(reader) {
    super(reader);
    this.shader = new PPtr(reader);
    if (reader.version[0] === 4 && reader.version[1] >= 1) {
      this.shaderKeywords = reader.readArrayT(() => reader.readAlignedString(), reader.readInt32());
    }
    this.shaderKeywords = '';
    if (reader.versionGTE(2021, 3)) {
      this.validKeywords = reader.readArrayT(() => reader.readAlignedString(), reader.readInt32());
      this.invalidKeywords = reader.readArrayT(() => reader.readAlignedString(), reader.readInt32());
    } else if (reader.version[0] >= 5) {
      this.shaderKeywords = reader.readAlignedString();
    }
    if (reader.version[0] >= 5) {
      this.lightmapFlags = reader.readUInt32();
    }
    if (reader.versionGTE(5, 6)) {
      this.enableInstancingVariants = reader.readBool();
      reader.align(4);
    }
    if (reader.versionGTE(4, 3)) {
      this.customRenderQueue = reader.readInt32();
    }
    if (reader.versionGTE(5, 1)) {
      let stringTagMapSize = reader.readInt32();
      this.stringTagMap = [];
      for (let i = 0; i < stringTagMapSize; i++) {
        let key = reader.readAlignedString();
        this.stringTagMap.push(new KVPair(key, reader.readAlignedString()));
      }
    }
    if (reader.versionGTE(5, 6)) {
      this.disabledShaderPasses = reader.readArrayT(() => reader.readAlignedString(), reader.readInt32());
    }
    this.savedProperties = new UnityPropertySheet(reader);
  }

  getTexEnv(key) {
    let texEnv = this.savedProperties.texEnvs.filter(t => t.key === key)[0];
    if (texEnv) {
      let texPtr = texEnv.value.texture;
      texPtr.resolve();
      if (texPtr.object) {
        return texPtr.object;
      }
    }
    return null
  }

  getInt(key) {
    return this.savedProperties.ints.filter(t => t.key === key)[0]?.value ?? null;
  }

  getFloat(key) {
    return this.savedProperties.floats.filter(t => t.key === key)[0]?.value ?? null;
  }

  getColor(key) {
    return this.savedProperties.colors.filter(t => t.key === key)[0]?.value ?? null;
  }

  async createPreview() {
    let mainTex = this.getTex('_MainTex');
    if (mainTex) {
      return await mainTex.createPreview();
    }
    return document.createElement('div');
  }
}
