import {Chunk} from "./chunk";

class Entry {
  constructor(reader) {
    this.key = reader.readString();
    this.value = reader.readString();
  }
}

export class MetaChunk extends Chunk {
  constructor(reader) {
    super(reader);
    this.entries = [];
    for (let i = 0; i < reader.readUInt32(); i++) {
      this.entries.push(new Entry(reader));
    }
  }
}