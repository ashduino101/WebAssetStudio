import {Chunk} from "./chunk";
import {BinaryReader} from "../../binaryReader";
import {decodeZInt32} from "../zigzag";

function encodeDiff(a) {
  let b = [];
  let prev = 0;
  for (let val of a) {
    [val, prev] = [val - prev, val];
    b.push(val);
  }
  return b;
}

function decodeDiff(a) {
  let b = [];
  let prev = 0;
  for (let val of a) {
    val += prev;
    prev = val;
    b.push(val);
  }
  return b;
}

export function decodeReferences(reader, length) {
  let value = [];
  let tempReader = new BinaryReader(reader.read(length * 4), 'big');
  for (let i = 0; i < length; i++) {
    let val = tempReader.readUInt32();
    value.push(decodeZInt32(val));
  }
  return decodeDiff(value);
}

export class InstancesChunk extends Chunk {
  constructor(reader) {
    super(reader);
    this.classID = reader.readInt32();
    this.className = reader.readString();
    this.hasService = reader.readBool();
    let length = reader.readUInt32();
    this.ids = decodeReferences(reader, length);
    if (this.hasService) {
      this.isService = reader.readArrayT(reader.readBool.bind(reader), length);
    }
  }
}