import {BinaryWriter} from "../binaryWriter";
import {BinaryReader} from "../binaryReader";

export function decodeZInt32(n) {
  let sign = n & 1;
  return sign ? -(n >> 1) - 1 : n >> 1;
}

export function readZInt32(reader) {
  return decodeZInt32(new BinaryReader(reader.read(4), 'big').readUInt32())
}

export function readZInt64(reader) {  // TODO this probably doesn't work due to stupid javascript bit shifting behaviour
  return decodeZInt32(Number(new BinaryReader(reader.read(8), 'big').readUInt64()));
}

export function decodeRFloat32(n) {  // "n" should be decoded as a uint32
  n = (n >> 1) | (n << 31);
  let w = new BinaryWriter(4, 'little', 0);
  w.writeInt32(n);
  return new BinaryReader(w.getData(), 'little').readFloat32();
}

export function readRFloat32(reader) {
  return decodeRFloat32(new BinaryReader(reader.read(4), 'big').readUInt32());
}
