import ClassIDType from "./classIDType";
import {SharedStrings} from "./sharedStrings";
import {BinaryReader, SEEK_CUR} from "./reader";
import {BuildTarget} from "./buildTarget";
import {ObjectReader} from "./objectReader";
import {UnityObject} from "./classes/object";
import {getClassName} from "./utils";

export class TypeTree {
  exposedAttributes = [
    'level',
    'type',
    'name',
    'size',
    'index',
    'typeFlags',
    'metaFlag',
    'children',
  ];

  constructor(version, reader) {
    this.version = version;
    this.reader = reader;
    this.children = [];
    this.textDecoder = new TextDecoder('utf-8');
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

  readLegacy(type, level = 0) {
    this.level = level;
    this.type = this.reader.readCString();
    this.name = this.reader.readCString();
    this.size = this.reader.readInt32();
    if (this.version === 2) {
      let varCount = this.reader.readInt32();
    }
    if (this.version !== 3) {
      this.index = this.reader.readInt32();
    }
    this.typeFlags = this.reader.readInt32();
    this.version = this.reader.readInt32();
    if (this.version !== 3) {
      this.metaFlag = this.reader.readInt32();
    }
    let childCount = this.reader.readInt32();
    for (let i = 0; i < childCount; i++) {
      this.children.push(this.readLegacy(type, level + 1));
    }
    return this;
  }

  readBlob() {
    const numNodes = this.reader.readInt32();
    const stringTableSize = this.reader.readInt32();
    let nodeReader = new BinaryReader(this.reader.read(((this.version >= 19) ? 32 : 24) * numNodes));
    nodeReader.endian = this.reader.endian;
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
        curr = new TypeTree(this.version, undefined);
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
      if (this.version >= 19) {
        curr.refHash = nodeReader.readUInt64();
      }
    }
    this.reader = undefined;
    this.textDecoder = undefined;
  }

  skipBlob() {
    const numNodes = this.reader.readUInt32();
    const stringTableSize = this.reader.readUInt32();
    this.reader.seek(((this.version >= 19) ? 32 : 24) * numNodes + stringTableSize, SEEK_CUR);
  }
}

export class TypeTreeReference {
  constructor(reader, version, classID, isStripped, scriptTypeIndex, scriptID, oldTypeHash, offset) {
    this.reader = reader;
    this.version = version;
    this.classID = classID;
    this.isStripped = isStripped;
    this.scriptTypeIndex = scriptTypeIndex;
    this.scriptID = scriptID;
    this.oldTypeHash = oldTypeHash;
    this.offset = offset;
  }

  get tree() {
    this.reader.seek(this.offset);

    // if (this.enableTypeTrees) {
    let tree = new TypeTree(this.version, this.reader);
    if (this.version >= 12 || this.version === 10) {
      tree.readBlob();
    } else {
      tree.readLegacy();
    }
    // }

    return tree;
  }
}

export class ObjectInfo {
  constructor(reader, version, unityVersion, targetPlatform) {
    this._reader = reader;
    this._version = version;
    this._unityVersion = unityVersion;
    this._targetPlatform = targetPlatform;
  }

  getClassName() {
    return getClassName(this.classID);
  }

  _createReader() {
    this._reader.seek(this.offset);
    const objReader = new ObjectReader(
      this._reader.read(this.size),
      this._version,
      this._unityVersion,
      this._targetPlatform,
      this.pathID,
      this.offset,
      this.size,
      this.classID,
      this.typeID
    );
    objReader.endian = this._reader.endian;
    return objReader;
  }

  _tryGetClass() {
    let cls = ClassIDType[this.classID];
    if (typeof cls == 'string') {
      console.error('unsupported class:', cls);
      return UnityObject;  // safe fallback
    }
    return cls;
  }

  get object() {
    if (typeof this.cachedObject == 'undefined') {
      let cls = this._tryGetClass();
      if (cls) {
        this.cachedObject = new cls(this._createReader());
      } else {
        this.cachedObject = {};
      }
    }
    return this.cachedObject;
  }

  get name() {
    if (typeof this.cachedName == 'undefined') {
      let cls = this._tryGetClass();
      if (!cls) {
        this.cachedName = '<unknown>';
      } else {
        this.cachedName = cls.getName(this._createReader());
      }
      if (this.cachedName === '') {
        this.cachedName = '<empty>';
      }
    }
    return this.cachedName;
  }
}

export class LocalObjectIdentifier {
  exposedAttributes = [
    'localFileIndex',
    'localIdentifier'
  ];

  constructor() {
  }
}

export class FileIdentifier {
  exposedAttributes = [
    'guid',
    'type',
    'path'
  ];

  constructor() {
  }
}

export class ParsedNode {
  constructor() {
    this.name = '<unknown>';
    this.type = '<unknown>';
    this.children = [];
  }
}

export class ParsedArrayNode {
  constructor() {
    this.items = [];
  }
}

export class ObjectCollection {
  constructor() {
    this.objects = [];
  }

  push(obj) {
    this.objects.push(obj);
  }

  get(pathID) {
    return this.objects.filter(obj => obj.pathID = pathID)[0];
  }
}

export class AssetFile {
  exposedAttributes = [
    'version',
    'metadataSize',
    'fileSize',
    'dataOffset',
    'endianness',
    'unityVersion',
    'targetPlatform',
    'enableTypeTrees',
    'types',
    'objects',
    'scriptTypes',
    'externals',
    'refTypes',
    'userInformation'
  ]

  constructor(reader) {
    this.reader = reader;
  }

  parse() {
    this.metadataSize = this.reader.readUInt32();
    this.fileSize = this.reader.readUInt32();
    this.version = this.reader.readUInt32();
    this.dataOffset = this.reader.readUInt32();
    if (this.version >= 9) {
      this.endianness = ['little', 'big'][this.reader.readUInt32() % 2];
    } else {
      this.endianness = 'big';
    }
    if (this.version >= 22) {
      this.metadataSize = this.reader.readUInt32();
      this.fileSize = Number(this.reader.readInt64());
      this.dataOffset = Number(this.reader.readInt64());
      this.reader.readInt64();  // unknown
    }
    this.reader.endian = this.endianness;

    // Metadata
    if (this.version >= 7) {
      this.unityVersion = this.reader.readCString();
    } else {
      this.unityVersion = '2.5.0f5';
    }
    if (this.version >= 8) {
      this.targetPlatform = BuildTarget[this.reader.readUInt32()];
    }
    if (this.version >= 13) {
      this.enableTypeTrees = this.reader.readBool();
    }

    // Types
    const typeCount = this.reader.readUInt32();
    this.types = [];
    for (let i = 0; i < typeCount; i++) {
      this.types.push(this.readSerializedTypeAsReference(false));
    }

    if (this.version >= 7 && this.version < 14) {
      this.hasLongIDs = this.reader.readInt32();
    }

    // Objects
    let objectCount = this.reader.readInt32()
    this.objects = new ObjectCollection();
    for (let i = 0; i < objectCount; i++) {
      let info = new ObjectInfo(this.reader, this.version, this.unityVersion, this.targetPlatform);
      if (this.hasLongIDs) {
        info.pathID = this.reader.readInt64();
      } else if (this.version < 14) {
        info.pathID = this.reader.readInt32();
      } else {
        this.reader.align(4);
        info.pathID = this.reader.readInt64();
      }
      if (this.version >= 22) {
        info.offset = Number(this.reader.readInt64());
      } else {
        info.offset = this.reader.readUInt32();
      }
      info.offset += this.dataOffset;
      info.size = this.reader.readUInt32();
      info.typeID = this.reader.readInt32();
      if (this.version < 16) {
        info.classID = this.reader.readUInt16();
      } else {
        let type = this.types[info.typeID];
        info.classID = type.classID;
      }
      if (this.version < 11) {
        info.isDestroyed = this.reader.readUInt16();
      } else {
        info.isDestroyed = false;
      }
      if (this.version >= 11 && this.version < 17) {
        info.scriptTypeIndex = this.reader.readInt16();
      } else {
        info.scriptTypeIndex = -1;
      }
      if (this.version === 15 || this.version === 16) {
        info.stripped = this.reader.read(1)[0];
      } else {
        info.stripped = false;
      }
      this.objects.push(info);
    }

    this.scriptTypes = [];
    if (this.version >= 11) {
      let scriptCount = this.reader.readInt32();
      for (let i = 0; i < scriptCount; i++) {
        let scriptType = new LocalObjectIdentifier();
        scriptType.localFileIndex = this.reader.readInt32();
        if (this.version < 14) {
          scriptType.localIdentifier = this.reader.readInt32();
        } else {
          this.reader.align(4);
          scriptType.localIdentifier = this.reader.readInt64();
        }
        this.scriptTypes.push(scriptType);
      }
    }

    let externalsCount = this.reader.readInt32();
    this.externals = [];
    for (let i = 0; i < externalsCount; i++) {
      let external = new FileIdentifier();
      if (this.version >= 6) {
        let empty = this.reader.readCString();
      }
      if (this.version >= 5) {
        external.guid = [...this.reader.read(16)].map(i => i.toString(16).padStart(2, '0')).join('');
        external.type = this.reader.readInt32();
      }
      external.path = this.reader.readCString();
      this.externals.push(external);
    }

    this.refTypes = [];
    if (this.version >= 20) {
      let refTypeCount = this.reader.readInt32();
      for (let i = 0; i < refTypeCount; i++) {
        this.refTypes.push(this.readSerializedTypeAsReference(true));
      }
    }

    if (this.version >= 5) {
      this.userInformation = this.reader.readCString();
    }
  }

  readSerializedTypeInfoOnly(isRef) {
    let type = {};
    type.classID = this.reader.readInt32();
    if (this.version >= 16) {
      type.isStripped = this.reader.readBool();
    } else {
      type.isStripped = false;
    }
    type.scriptTypeIndex = 0;
    if (this.version >= 17) {
      type.scriptTypeIndex = this.reader.readInt16();
    }
    if (this.version >= 13) {
      if ((isRef && type.scriptTypeIndex >= 0) || ((this.version < 16 && type.classID < 0) ||
        (this.version >= 16 && type.classID === 114))) {
        type.scriptID = this.reader.read(16);
      }
      type.oldTypeHash = this.reader.read(16);
    }
    let treeOffset = this.reader.tell();
    this.skipSerializedTypeData();
    if (this.enableTypeTrees) {
      if (this.version >= 21) {
        if (isRef) {
          type.className = this.reader.readCString();
          type.nameSpace = this.reader.readCString();
          type.asmName = this.reader.readCString();
        } else {
          type.typeDependencies = this.reader.readArrayT(this.reader.readInt32, this.reader.readUInt32());
        }
      }
    }
    return [type, treeOffset];
  }

  skipSerializedTypeData() {
    if (this.enableTypeTrees) {
      let tree = new TypeTree(this.version, this.reader);
      if (this.version >= 12 || this.version === 10) {
        tree.skipBlob();
      } else {
        tree.readLegacy();  // no skip function for this
      }
    }
  }

  readSerializedTypeAsReference(isRef) {
    let [info, offset] = this.readSerializedTypeInfoOnly(isRef);

    return new TypeTreeReference(
      this.reader,
      this.version,
      info.classID,
      info.isStripped,
      info.scriptTypeIndex,
      info.scriptID,
      info.oldTypeHash,
      offset
    )
  }

  getClass(classID) {
    return this.types.find(x => x.classID === classID);
  }

  /**
   * @param type {string}
   * @param reader {BinaryReader}
   * @param size {number}
   * @returns {*}
   */
  readType(type, reader, size) {  // For primitive types - `type` is a string
    switch (type) {
      case 'bool':
        return reader.readBool();
      case 'SInt8':
        return reader.readInt8();
      case 'UInt8':
        return reader.readUInt8();
      case 'char':
        return new TextDecoder('utf16le').decode(reader.read(2));
      case 'short':
      case 'SInt16':
        return reader.readInt16();
      case 'unsigned short':
      case 'UInt16':
        return reader.readUInt16();
      case 'SInt32':
      case 'int':
        return reader.readInt32();
      case 'UInt32':
      case 'unsigned int':
      case 'Type*':
        return reader.readUInt32();
      case 'long long':
      case 'SInt64':
        return reader.readInt64();
      case 'unsigned long long':
      case 'UInt64':
      case 'FileSize':
        return reader.readUInt64();
      case 'float':
        return reader.readFloat32();
      case 'double':
        return reader.readFloat64();
      case 'string':
        if (size < 0) {
          size = reader.readUInt32();
        }
        let text = new TextDecoder('utf-8').decode(reader.read(size));
        reader.align(4);
        return text;
      case 'TypelessData':
        let dataSize = reader.readUInt32();
        return reader.read(dataSize);
      default:
        throw new Error('Unknown/unsupported type: ' + type);
    }
  }

  isNonPrimitiveParsingSupported(type) {
    return ['string', 'TypelessData'].includes(type);
  }

  shouldCheckTypeAlignment(type) {
    return [
      'SInt8', 'UInt8', 'char',
      'short', 'SInt16', 'unsigned short', 'UInt16',
      'int', 'SInt32', 'unsigned int', 'UInt32',
      'Type*',
      'long long', 'SInt64', 'unsigned long long', 'UInt64', 'FileSize',
      'float', 'double',
      'bool',
      'string',
      'map',
      'TypelessData',
      'Array'
    ].includes(type);
  }

  parseTypeTree(tree, reader, endOffset, level=0) {
    let node = new ParsedNode();
    if (reader.tell() > endOffset) {
      console.warn('Interrupting to prevent overread (tree error?)');
      return {interruptParsing: true};
    }
    node.name = tree.name;
    node.type = tree.type;
    // this.currentBranch[level] = node.name;
    // if (level < 14) {
    //     console.log(node.name, reader.tell(), level, this.currentBranch);
    // }
    if (tree.children.length === 0 || this.isNonPrimitiveParsingSupported(tree.type)) {
      node.value = this.readType(tree.type, reader, tree.size);
    } else if ((tree.typeFlags & 1) === 1) {  // is array
      let arraySizeField = tree.children[0];
      let arrayTypeField = tree.children[1];
      let arrayLen = this.readType(arraySizeField.type, reader, arraySizeField.size);
      if (arrayLen >= 10_000_000) {
        console.warn('Unusually large array:', arrayLen, reader.tell())
      }
      let arrayNode = new ParsedArrayNode();
      if (arrayTypeField.type === 'UInt8' || arrayTypeField.type === 'SInt8') {
        arrayNode.items = new Uint8Array(arrayLen);
      } else {
        for (let i = 0; i < arrayLen; i++) {
          let obj = this.parseTypeTree(arrayTypeField, reader, endOffset, level + 1);
          arrayNode.items.push(obj);
          if (obj.interruptParsing) {
            if (level === 0) {
              return node;
            }
            return obj;
          }
        }
      }
      node.children.push(arrayNode);
    } else {
      for (let child of tree.children) {
        let obj = this.parseTypeTree(child, reader, endOffset, level + 1);
        node.children.push(obj);
        if (obj.interruptParsing) {
          if (level === 0) {
            return node;
          }
          return obj;
        }
      }
    }
    if ((/*this.shouldCheckTypeAlignment(tree.type) && */((tree.metaFlag & 0x4000) === 0x4000))) {
      this.reader.align(4);
    }
    return node;
  }

  getTypeFromReference(typeRef) {
    return typeRef.tree;
  }

  getObjectUsingTree(obj) {  // TODO: fallback to explicit class system
    const typeRef = this.getClass(obj.classID);
    this.currentBranch = {};
    if (this.enableTypeTrees) {
      const type = this.getTypeFromReference(typeRef);
      this.reader.seek(obj.offset);
      return this.parseTypeTree(type, this.reader, obj.offset + obj.size);
    } else {
      this.reader.seek(obj.offset);
      return this.reader.read(obj.size);
    }
  }

  getLocalTypeRegistryAsJSON() {
    let types = {};
    for (let type of this.types) {
      types[type.classID] = this.getTypeFromReference(type);
    }
    return JSON.stringify(types);
  }
}