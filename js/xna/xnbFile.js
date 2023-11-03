const XNB_MAGIC = 'XNB'
const XNB_PLATFORMS = {
  'w': 'Microsoft Windows',
  'm': 'Windows Phone 7',
  'x': 'Xbox 360'
}

class TypeReader {
  constructor(reader) {
    this.name = reader.readVarString();
    this.version = reader.readInt32();

    this.class = this.name.split(',')[0];
  }

  read(reader) {
    switch (this.class) {
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
      default:
        return // sometuibn jerhejrheswkajhfgHJKDG
    }
  }
}

export default class XNBFile {
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
    console.log(numTypeReaders)
    this.typeReaders = [];
    for (let i = 0; i < numTypeReaders; i++) {
      this.typeReaders.push(new TypeReader(reader));
    }
    this.sharedResourceCount = reader.readVarInt();
  }
}