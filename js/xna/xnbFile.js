import {typeReaders} from "./readers";

const XNB_MAGIC = 'XNB'
const XNB_PLATFORMS = {
  'w': 'Microsoft Windows',
  'm': 'Windows Phone 7',
  'x': 'Xbox 360'
}

class TypeReader {
  static exposedAttributes = [
    'name',
    'version'
  ];
  constructor(reader, typeReaders) {
    this.name = reader.readVarString();
    this.version = reader.readInt32();

    this.class = this.name.split(',')[0];
    this.typeReaders = typeReaders;
  }

  read(reader, cls = this.class) {
    switch (cls) {
      case 'Microsoft.Xna.Framework.Content.ByteReader':
        return reader.readUInt8();
      case 'Microsoft.Xna.Framework.Content.SByteReader':
        return reader.readInt8();
      case 'Microsoft.Xna.Framework.Content.Int16Reader':
        return reader.readInt16();
      case 'Microsoft.Xna.Framework.Content.UInt16Reader':
        return reader.readUInt16();
      case 'Microsoft.Xna.Framework.Content.Int32Reader':
        return reader.readInt32();
      case 'Microsoft.Xna.Framework.Content.UInt32Reader':
        return reader.readUInt32();
      case 'Microsoft.Xna.Framework.Content.Int64Reader':
        return reader.readInt64();
      case 'Microsoft.Xna.Framework.Content.UInt64Reader':
        return reader.readUInt64();
      case 'Microsoft.Xna.Framework.Content.SingleReader':
        return reader.readFloat32();
      case 'Microsoft.Xna.Framework.Content.DoubleReader':
        return reader.readFloat64();
      case 'Microsoft.Xna.Framework.Content.BooleanReader':
        return reader.readBool();
      case 'Microsoft.Xna.Framework.Content.CharReader':
        return reader.readChars(1);
      case 'Microsoft.Xna.Framework.Content.StringReader':
        return reader.readVarString();
      case 'Microsoft.Xna.Framework.Content.ObjectReader':
        const typeId = reader.readVarInt();
        if (typeId === 0) return null;
        return this.typeReaders[typeId].read(reader);
      default:
        // todo: idk if these are actually how the reader names are represented in the file
        let type;
        if ((type = /Microsoft\.Xna\.Framework\.Content\.EnumReader`1\[\[([\w\d.])+]]/.exec(this.class))?.length > 0) {
          return this.read(reader, type[0]);
        } else if ((type = /Microsoft\.Xna\.Framework\.Content\.NullableReader`1\[\[([\w\d.])+]]/.exec(this.class))?.length > 0) {
          if (reader.readBool()) {
            return this.read(reader, type[0]);
          } else {
            return null;
          }
        } else if ((type = /Microsoft\.Xna\.Framework\.Content\.(?:Array|List)Reader`1\[\[([\w\d.])+]]/.exec(this.class))?.length > 0) {
          return reader.readArrayT(this.read.bind(this, reader, type[0]), reader.readUInt32());
        } else if ((type = /Microsoft\.Xna\.Framework\.Content\.DictionaryReader`2\[\[([\w\d.])+],\[([\w\d.])+]]/.exec(this.class))?.length > 1) {
          const dict = {};
          for (let i = 0; i < reader.readUInt32(); i++) {
            dict[this.read(reader, type[0])] = this.read(reader, type[1]);
          }
          return dict;
        } else {
          const typeReader = typeReaders[this.class];
          if (typeReader) {
            return new typeReader[0](reader, this.typeReaders);  // Some readers take typeReaders as an argument for polymorphic types
          }
        }
    }
  }
}

export default class XNBFile {
  static exposedAttributes = [
    'platform',
    'formatVersion',
    'isHiDef',
    'isCompressed',
    'size',
    'typeReaders',
    'primaryAsset',
    'sharedResources'
  ]

  constructor(reader) {
    reader.endian = 'little';
    if (reader.readChars(3) !== XNB_MAGIC) {
      throw new Error('Not an XNB file');
    }
    this.platform = XNB_PLATFORMS[reader.readChars(1)];
    this.formatVersion = reader.readUInt8();
    const flags = reader.readUInt8();
    this.isHiDef = flags & 0x01;
    this.isCompressed = flags & 0x80;
    this.size = reader.readUInt32();
    if (this.isCompressed) {
      this.uncompressedSize = reader.readUInt32();
    }
    let numTypeReaders = reader.readVarInt();
    this.typeReaders = [];
    for (let i = 0; i < numTypeReaders; i++) {
      this.typeReaders.push(new TypeReader(reader, this.typeReaders));
    }
    const sharedResourceCount = reader.readVarInt();
    this.primaryAsset = this.typeReaders[reader.readVarInt() - 1]?.read(reader);
    this.sharedResources = [];
    for (let i = 0; i < sharedResourceCount; i++) {
      this.sharedResources.push(this.typeReaders[reader.readVarInt() - 1]?.read(reader));
    }
  }
}