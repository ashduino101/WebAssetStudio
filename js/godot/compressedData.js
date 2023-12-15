import {ZSTDDecoder} from 'zstddec';
import {lz4_decompress} from "../encoders";

const CompressionMode = [
  'LZ',
  'Deflate',
  'Zstd',
  'GZip',
  'Brotli'
];

export class DataDecompressor {
  constructor() {}

  async decompress(reader) {
    // we should be at the part we need already
    this.mode = CompressionMode[reader.readInt32()];
    switch (this.mode) {
      case 'Zstd':
        this.decoder = new ZSTDDecoder();
        await this.decoder.init();
        break;
    }
    this.blockSize = reader.readInt32();
    if (this.blockSize === 0) {
      throw new Error('Block size cannot be 0');
    }

    this.readTotal = reader.readUInt32();

    const bc = this.readTotal / this.blockSize;
    this.data = new Uint8Array(Math.ceil(bc) * this.blockSize);
    this.blockSizes = [];
    for (let i = 0; i < bc; i++) {
      this.blockSizes.push(reader.readUInt32());
    }
    let offset = 0;
    for (const size of this.blockSizes) {
      let comp = reader.read(size);
      const buf = this.decompressBlock(comp);
      this.data.set(buf, offset);
      offset += buf.length;
    }

    return this.data;
  }

  decompressBlock(data) {
    switch (this.mode) {
      case 'LZ':
        return lz4_decompress(data, this.blockSize);
      case 'Deflate':
        return pako.inflate(data);
      case 'Zstd':
        return this.decoder.decode(data, this.blockSize);
      case 'GZip':
        return pako.inflate(data);
      case 'Brotli':
        break;
    }
  }
}