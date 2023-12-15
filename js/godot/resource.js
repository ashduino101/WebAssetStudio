import {getString, Variant} from "./variant";
import {ResourceType} from "./type";
import {OggSampleExtension} from "./extensions/oggSampleExtension";
import {WavSampleExtension} from "./extensions/wavSampleExtension";
import {CompressedTexture, StreamTexture} from "./types/texture";
import {BinaryReader, SEEK_CUR} from "../binaryReader";
import {Mp3SampleExtension} from "./extensions/mp3SampleExtension";
import {DataDecompressor} from "./compressedData";
import {FontFileExtension} from "./extensions/fontFileExtension";

const TYPE_RESOURCE = 0;
const TYPE_BINARY = 1;

export class Resource extends ResourceType {
  constructor(reader) {
    super();
    this.reader = reader;
  }

  async load() {
    let magic = this.reader.readChars(4);
    if (magic === 'RSCC') {
      const data = await new DataDecompressor().decompress(this.reader);
      this.reader = new BinaryReader(data, 'little');
    } else if (magic !== 'RSRC') {
      this.type = TYPE_BINARY;
      this.reader.seek(-4, SEEK_CUR);
      let parser = this.getParserForMagic(magic);
      if (parser) {
        this.parser = new parser(this.reader);
      }
      return this;
    }
    this.type = TYPE_RESOURCE;
    this.reader.endian = (!!this.reader.readInt32()) ? 'big' : 'little';  // is big-endian
    this.useReal64 = !!this.reader.readInt32();
    this.verMajor = this.reader.readInt32();
    this.verMinor = this.reader.readInt32();
    this.formatVersion = this.reader.readInt32();
    this.typeName = this.reader.readString();
    this.importOffset = this.reader.readInt64();
    this.flags = this.reader.readInt32();
    this.uid = this.reader.readInt64();
    this.reader.read(44);  // reserved
    this.stringTable = this.reader.readArrayT(this.reader.readString.bind(this.reader), this.reader.readInt32());
    this.externalResources = this.reader.readArrayT(() => {
      return {
        typeName: this.reader.readString(),
        path: this.reader.readString(),
        uid: ((this.flags & 2) !== 0) ? this.reader.readInt64() : 0
      }
    }, this.reader.readInt32());
    this.internalResources = this.reader.readArrayT(() => {
      return {
        path: this.reader.readString(),
        offset: this.reader.readInt64()
      }
    }, this.reader.readInt32());
    let typeName = this.reader.readString();
    let properties = {};
    let numProperties = this.reader.readInt32();
    for (let i = 0; i < numProperties; i++) {
      properties[getString(this.reader, this.stringTable)] = new Variant(this.reader).value;
    }
    this.resource = {
      typeName,
      properties
    }
  }

  getParserForMagic(magic) {
    switch (magic) {
      case 'GDST':
        return StreamTexture;
      case 'GST2':
        return CompressedTexture;
      default:
        return null;
    }
  }

  getExtension() {
    switch (this.typeName) {
      case 'AudioStreamOGGVorbis':
        return new OggSampleExtension()
      case 'AudioStreamSample':
        return new WavSampleExtension()
      case 'AudioStreamMP3':
        return new Mp3SampleExtension()
      case 'FontFile':
        return new FontFileExtension()
      default:
        return null;
    }
  }

  async createPreview() {
    if (this.type === TYPE_BINARY) {
      if (this.parser && typeof this.parser.createPreview == 'function') {
        return await this.parser.createPreview();
      } else {
        return document.createElement('div');
      }
    }
    const ext = this.getExtension();
    if (ext) {
      return ext.createPreview(this);
    } else {
      return document.createElement('div');
    }
  }

  getExport() {
    return this.getExtension().exportFile(this);
  }
}