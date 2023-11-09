import XNBFile from "./xna/xnbFile";
import {BinaryReader} from "./binaryReader";
import {PAK_MAGIC} from "./unreal/pakfile";
import {inflate} from "pako";
import DefaultTree from "./defaultTree";
import UnityTree from "./unityfs/unityTree";
import XNBTree from "./xna/xnbTree";

const fileTypes = {
  Resource: 0,
  UnityBundle: 1,
  UnityAsset: 2,
  GodotPck: 10,
  GodotResource: 11,
  GodotTexture: 12,
  GodotScene: 13,
  FSB5: 20,
  UnrealPak: 30,
  UnrealPackage: 31,
  XNB: 40
}

export default class FileHandler {
  constructor(treeSelector) {
    this.data = null;
    this.name = null;
    this.treeSelector = treeSelector;
  }

  loadFile(file) {
    return new Promise(resolve => {
      let reader = new FileReader();
      reader.onloadend = async b => {
        if (reader.result == null) {
          resolve(false);
          return;
        }
        this.data = new Uint8Array(reader.result);
        this.name = file.name;
        resolve(true);
      }
      reader.readAsArrayBuffer(file);
    });
  }

  _checkMagicBasic(nbytes, magic) {
    let data = this.data.slice(0, nbytes);
    return data.every((i, idx) => magic[idx] === i);
  }

  _checkUnityAsset() {
    const reader = new BinaryReader(this.data);
    if (reader.data.length < 20) {
      return false;
    }
    reader.readUInt32();
    let fileSize = BigInt(reader.readUInt32());
    const version = reader.readUInt32();
    let dataOffset = BigInt(reader.readUInt32());
    if (version >= 22) {
      if (reader.data.length < 48) {
        return false;
      }
      dataOffset = reader.readUInt64();
      fileSize = reader.readUInt64();
    }
    reader.seek(0);
    if (fileSize !== BigInt(reader.data.length)) {
      return false;
    }
    return dataOffset <= BigInt(reader.data.length);
  }

  _checkUnrealPak() {
    const reader = new BinaryReader(this.data);
    reader.seek(reader.size - 4);
    const limit = 2048;
    let i = 0;
    let found = false;
    while (i < limit) {
      let val = reader.readUInt32();
      if (val === PAK_MAGIC) {
        found = true;
        break;
      }
      reader.seek(reader.tell() - 5);
      i++;
    }
    return found;
  }

  getType() {
    const reader = new BinaryReader(this.data);
    // [Unity]
    // Bundle: "Unity" -- matches all bundle types ("FS", "Web", etc)
    if (this._checkMagicBasic(5, [0x55, 0x6e, 0x69, 0x74, 0x79])) return fileTypes.UnityBundle;
    // Asset: complicated, doesn't have magic
    if (this._checkUnityAsset()) return fileTypes.UnityAsset;
    // [Godot]
    // Package: "GDPC"
    if (this._checkMagicBasic(4, [0x47, 0x44, 0x50, 0x43])) return fileTypes.GodotPck;
    // Resource: "RSRC"
    if (this._checkMagicBasic(4, [0x52, 0x53, 0x52, 0x43])) return fileTypes.GodotResource;
    // Texture: "GDST"
    if (this._checkMagicBasic(4, [0x47, 0x44, 0x53, 0x54])) return fileTypes.GodotTexture;
    // Scene: "GDSC"
    if (this._checkMagicBasic(4, [0x47, 0x44, 0x53, 0x43])) return fileTypes.GodotScene;
    // [FSB5]
    // Soundbank: "FSB5"
    if (this._checkMagicBasic(4, [0x46, 0x53, 0x42, 0x35])) return fileTypes.FSB5;
    // [Unreal]
    // Packed assets: very weird and convoluted, we'll only check if the extension matches
    if (this.name.endsWith('.pak') && this._checkUnrealPak()) return fileTypes.UnrealPak;
    // Packages/.uasset: really weird magic that doesn't even have a meaning
    if (this._checkMagicBasic(4, [0xc1, 0x83, 0x2a, 0x9e])) return fileTypes.UnrealPackage;
    // [XNA]
    // XNB asset: "XNB"
    if (this._checkMagicBasic(3, [0x58, 0x4e, 0x42])) return fileTypes.XNB;

    // [Special types]
    // GZip-compressed
    if (this._checkMagicBasic(2, [0x1f, 0x8b])) {
      // Decompress and try again
      this.data = inflate(this.data)
      return this.getType();
    }
    // Resource (unknown, maybe referenced by another file)
    return fileTypes.Resource;
  }

  async getTree() {
    let tree;
    switch (this.getType()) {
      case fileTypes.UnityBundle:
      case fileTypes.UnityAsset:
        tree = new UnityTree(this.treeSelector);
        break;
      case fileTypes.XNB:
        tree = new XNBTree(this.treeSelector);
        break;
      default:
        tree = new DefaultTree(this.treeSelector);
        break;
    }
    await tree.loadFile(this.data);
    return tree;
  }
}