import {getString, Variant} from "./variant";
import {ResourceType} from "./type";
import {OggSampleExtension} from "./extensions/oggSampleExtension";
import {WavSampleExtension} from "./extensions/wavSampleExtension";

export class Resource extends ResourceType {
  constructor(reader) {
    super();
    if (reader.readChars(4) !== 'RSRC') {
      throw new Error('Invalid resource file');
    }

    reader.endian = (!!reader.readInt32()) ? 'big' : 'little';  // is big-endian
    this.useReal64 = !!reader.readInt32();
    this.verMajor = reader.readInt32();
    this.verMinor = reader.readInt32();
    this.formatVersion = reader.readInt32();
    this.typeName = reader.readString();
    this.importOffset = reader.readInt64();
    this.flags = reader.readInt32();
    this.uid = reader.readInt64();
    reader.read(44);  // reserved
    this.stringTable = reader.readArrayT(reader.readString.bind(reader), reader.readInt32());
    this.externalResources = reader.readArrayT(() => {
      return {
        typeName: reader.readString(),
        path: reader.readString(),
        uid: ((this.flags & 2) !== 0) ? reader.readInt64() : 0
      }
    }, reader.readInt32());
    this.internalResources = reader.readArrayT(() => {
      return {
        path: reader.readString(),
        offset: reader.readInt64()
      }
    }, reader.readInt32());
    let typeName = reader.readString();
    let properties = {};
    let numProperties = reader.readInt32();
    for (let i = 0; i < numProperties; i++) {
      properties[getString(reader, this.stringTable)] = new Variant(reader).value;
    }
    this.resource = {
      typeName,
      properties
    }
  }

  createPreview() {
    switch (this.typeName) {
      case 'AudioStreamOGGVorbis':
        return new OggSampleExtension().createPreview(this);
      case 'AudioStreamSample':
        return new WavSampleExtension().createPreview(this);
      default:
        return document.createElement('div');
    }
  }
}