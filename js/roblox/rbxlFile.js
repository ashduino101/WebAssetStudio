import {BinaryReader} from "../binaryReader";
import {lz4_decompress} from "../encoders";
import {MetaChunk} from "./chunks/meta";
import {SharedStringsChunk} from "./chunks/sstr";
import {InstancesChunk} from "./chunks/inst";
import {PropChunk} from "./chunks/prop";
import {ParentChunk} from "./chunks/prnt";

export class Chunk {
  constructor(reader) {
    this.signature = reader.readChars(4).split('\0')[0];  // remove trailing nulls
    this.compressedSize = reader.readUInt32();
    this.uncompressedSize = reader.readUInt32();
    reader.readUInt32();  // reserved
    if (this.compressedSize === 0) {  // Our LZ4 implementation doesn't like empty data
      this.payload = new Uint8Array(0);
    } else {
      this.payload = lz4_decompress(reader.read(this.compressedSize), this.uncompressedSize);
    }
    let payloadReader = new BinaryReader(this.payload, 'little');
    switch (this.signature) {
      case 'META':
        this.value = new MetaChunk(payloadReader);
        break;
      case 'SSTR':
        this.value = new SharedStringsChunk(payloadReader);
        break;
      case 'INST':
        this.value = new InstancesChunk(payloadReader);
        break;
      case 'PROP':
        this.value = new PropChunk(payloadReader);
        break;
      case 'PRNT':
        this.value = new ParentChunk(payloadReader);
        break;
      case 'END':
        this.value = null;
        break;
    }
  }
}

export class RBXLFile {
  constructor(data) {
    let reader = new BinaryReader(data, 'little');
    if (
      reader.readChars(8) !== '<roblox!' ||  // magic
      reader.readUInt16() !== 65417 ||  // to prevent decoding errors
      reader.readUInt32() !== 169478669  // line endings
    ) {
      throw new Error('Not a RBXL file');
    }

    this.version = reader.readUInt16();
    if (this.version > 0) {
      throw new Error(`Unsupported version ${this.version}!`);
    }

    this.classCount = reader.readUInt32();
    this.instanceCount = reader.readUInt32();
    reader.readUInt64();  // reserved
    this.chunks = [];
    let i = 0;
    while (true) {
      console.log(i)
      let chunk = new Chunk(reader);
      if (chunk.signature === 'END') {
        break;
      }
      this.chunks.push(chunk);
      i++;
    }
  }
}