import {Chunk} from "./chunk";

class SharedStringValue {
  constructor(reader) {
    this.hash = reader.readGUID();  // same as hash
    this.value = reader.readString();
  }
}

export class SharedStringsChunk extends Chunk {
  constructor(reader) {
    super(reader);
    this.version = reader.readInt32();
    this.strings = [];
    for (let i = 0; i < reader.readUInt32(); i++) {
      this.strings.push(new SharedStringValue(reader));
    }
  }
}