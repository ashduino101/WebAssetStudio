const
  FORMAT_MASK_IMAGE_FORMAT = (1 << 20) - 1,
  FORMAT_BIT_LOSSLESS = 1 << 20,
  FORMAT_BIT_LOSSY = 1 << 21,
  FORMAT_BIT_STREAM = 1 << 22,
  FORMAT_BIT_HAS_MIPMAPS = 1 << 23,
  FORMAT_BIT_DETECT_3D = 1 << 24,
  FORMAT_BIT_DETECT_SRGB = 1 << 25,
  FORMAT_BIT_DETECT_NORMAL = 1 << 26;


class StreamTexture {  // older v3 format
  constructor(reader) {
    if (reader.readChars(4) !== 'GDST') {
      throw new Error('Invalid stream texture');
    }

    this.width = reader.readInt16();
    this.customWidth = reader.readInt16();
    this.height = reader.readInt16();
    this.customHeight = reader.readInt16();

    this.flags = reader.readUInt32();
    this.dataFormat = reader.readUInt32();

    if (!(this.dataFormat & FORMAT_BIT_STREAM)) {
      this.sizeLimit = 0;
    }

    if ((this.dataFormat & FORMAT_BIT_LOSSLESS) || (this.dataFormat & FORMAT_BIT_LOSSY)) {
      let mipMaps = reader.readInt32();
      let size = reader.readInt32();
    }
  }
}