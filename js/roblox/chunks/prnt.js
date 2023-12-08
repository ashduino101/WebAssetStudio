import {Chunk} from "./chunk";
import {decodeReferences} from "./inst";

export class ParentChunk extends Chunk {
  constructor(reader) {
    super(reader);
    reader.readUInt8();  // reserved
    let length = reader.readUInt32();
    this.children = decodeReferences(reader, length);
    this.parents = decodeReferences(reader, length);
  }
}