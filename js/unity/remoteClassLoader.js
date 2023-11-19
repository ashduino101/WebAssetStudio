import {BinaryReader, SEEK_CUR} from "../binaryReader";
import {SharedStrings} from "./sharedStrings";
import {BaseTypeTree} from "./typeTree";

class RemoteTypeTree extends BaseTypeTree {
  constructor(reader) {
    super();
    this.reader = reader;
  }

  getStringFromTable(table, offset=0) {
    return this.textDecoder.decode(
      table.slice(
        offset,
        table.slice(
          offset,
          table.length
        ).indexOf(0) + offset
      )
    );
  }

  getString(localTable, offset) {
    const isLocalOffset = (offset & 0x80000000) === 0;
    if (isLocalOffset) {
      return this.getStringFromTable(localTable, offset);
    } else {
      return this.getStringFromTable(SharedStrings, offset & 0x7fffffff);
    }
  }

  read() {
    const numNodes = this.reader.readInt32();
    const stringTableSize = this.reader.readInt32();
    let nodeReader = new BinaryReader(this.reader.read(24 * numNodes), this.reader.endian);
    let stringTable = this.reader.read(stringTableSize);

    let parents = [this];

    for (let i = 0; i < numNodes; i++) {
      let version = nodeReader.readUInt16();
      let level = nodeReader.read(1)[0];
      let curr;
      if (level === 0) {
        curr = this;
      } else {
        while (parents.length > level) {
          parents.pop();
        }
        curr = new RemoteTypeTree(undefined);
        curr.textDecoder = undefined;
        parents[parents.length - 1].children.push(curr);
        parents.push(curr);
      }

      curr.version = version;
      curr.level = level;
      curr.typeFlags = nodeReader.read(1)[0];
      curr.type = this.getString(stringTable, nodeReader.readInt32());
      curr.name = this.getString(stringTable, nodeReader.readInt32());
      curr.size = nodeReader.readInt32();
      curr.index = nodeReader.readInt32();
      curr.metaFlag = nodeReader.readInt32();
    }
    this.reader = undefined;
    this.textDecoder = undefined;
  }
}

export class RemoteClassLoader {
  constructor(unityVersion) {
    // this.structURL = `https://raw.githubusercontent.com/AssetRipper/TypeTreeDumps/main/StructsData/release/${unityVersion}.dat`;
    this.structURL = `/typetrees/${unityVersion}.dat`;
    this._data = null;
    this.trees = {};
  }

  async retrieve() {
    const resp = await fetch(this.structURL);
    const buf = await resp.arrayBuffer();
    this._data = new Uint8Array(buf);
  }

  async load() {
    if (this._data == null) await this.retrieve();
    const reader = new BinaryReader(this._data, 'little');
    const version = reader.readCString(64);
    reader.readUInt32();  // platform
    reader.readBool();  // has type trees (obviously true)
    const numTypes = reader.readUInt32();
    for (let i = 0; i < numTypes; i++) {
      const typeID = reader.readInt32();
      if (typeID < 0) {
        reader.read(0x20);
      } else {
        reader.read(0x10);
      }
      const tree = new RemoteTypeTree(reader);
      tree.read();
      this.trees[typeID] = tree;
    }
    console.log(this.trees[43]);
  }
}
