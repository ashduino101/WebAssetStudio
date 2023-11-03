import {Vector2, Vector3, Vector4, Quaternion, Color, Matrix4x4} from "./unityfs/basicTypes";

export const SEEK_SET = 0;
export const SEEK_CUR = 1;
export const SEEK_END = 2;

export class BinaryReader {
  /**
   * Creates a new BinaryReader.
   *
   * @param data {Uint8Array} Input data.
   * @param endian
   */
  constructor(data, endian = 'big') {
    this.data = data;
    this.offset = 0;
    this.endian = endian;
  }

  /**
   * Moves the cursor to the specified position.
   *
   * @param pos {number} A position within the file, or representing how many bytes to move the cursor.
   * @param mode {number} The seek mode. Can be SEEK_SET, SEEK_CUR, or SEEK_END.
   */
  seek(pos, mode=SEEK_SET) {
    switch (mode) {
      case SEEK_SET:
        this.offset = pos;
        break;
      case SEEK_CUR:
        this.offset += pos;
        break;
      case SEEK_END:
        this.offset = this.data.length
        break;
    }
    this.validateCursor();
  }

  /**
   * Gets the current cursor position.
   * @returns {number} The current offset of the cursor in the data.
   */
  tell() {
    return this.offset;
  }

  get size() {
    return this.data.length;
  }

  align(alignment) {
    let offset = this.tell();
    let mod = offset % alignment;
    if (mod !== 0) {
      this.seek(alignment - mod, SEEK_CUR);
    }
  }

  validateCursor() {
    if (this.offset < 0) {
      throw new Error('Cursor cannot be negative');
    }
    if (this.offset > this.data.length) {
      throw new Error('Cursor cannot be past end of data');
    }
  }

  read(nbytes) {
    return this.data.slice(this.offset, this.offset += nbytes);
  }

  readRaw(offset, size) {
    return this.data.slice(offset, offset + size);
  }

  readCString() {
    let s = '';
    let c;
    while ((c = this.read(1)[0]) !== 0) {
      s += String.fromCharCode(c);
    }
    return s;
  }

  readChars(count) {
    return new TextDecoder('utf-8').decode(this.read(count));
  }

  readString() {
    /* not aligned */
    return this.readChars(this.readUInt32()).split('\0')[0];
  }

  readVarString() {
    /* string prefixed with varint */
    return this.readChars(this.readVarInt()).split('\0')[0];
  }

  readAlignedString() {
    let s = this.readChars(this.readUInt32());
    this.align(4);
    return s;
  }

  readT(type, length) {
    let slice = this.read(length);
    let view = new DataView(slice.buffer);
    return view[`get${type}`](0, this.endian === 'little');
  }

  readBool() {
    return this.read(1)[0] === 1;
  }

  readUInt8() {
    return this.read(1)[0];
  }
  readInt8() {
    return this.readT('Int8', 1);
  }
  readUNorm8() {
    return this.readUInt8() / 0xFF;
  }
  readNorm8() {
    return this.readInt8() / 0xFF;
  }
  readUInt16() {
    return this.readT('Uint16', 2);
  }
  readInt16() {
    return this.readT('Int16', 2);
  }
  readUNorm16() {
    return this.readUInt16() / 0xFFFF;
  }
  readNorm16() {
    return this.readUInt16() / 0xFFFF;
  }
  readUInt32() {
    return this.readT('Uint32', 4);
  }
  readInt32() {
    return this.readT('Int32', 4);
  }
  readUInt64() {
    return this.readT('BigUint64', 8);
  }
  readInt64() {
    return this.readT('BigInt64', 8);
  }

  readVarInt() {
    let result = 0;
    let bitsRead = 0;
    let value;
    do {
      value = this.readUInt8();
      result |= (value & 0x7f) << bitsRead;
      bitsRead += 7;
    } while (value & 0x80);
    return result;
  }

  readFloat16() {  // extremely jank fp16 implementation
    let raw = new DataView(this.read(2).buffer).getUint16(0, true);
    // Convert to fp32
    const w = raw * 65536;  // avoid javascript issues
    const sign = w & 0x80000000;
    const nonsign = w & 0x7FFFFFFF;
    let renormShift = Math.clz32(nonsign);
    renormShift = renormShift > 5 ? renormShift - 5 : 0;
    const infNanMask = ((nonsign + 0x04000000) >> 8) & 0x7F800000;
    const zeroMask = (nonsign - 1) >> 31;
    const intVal = sign | ((((nonsign << renormShift >> 3) + ((0x70 - renormShift) << 23)) | infNanMask) & ~zeroMask);
    const view = new DataView(new Uint8Array(4).buffer);
    view.setUint32(0, intVal, true);
    return view.getFloat32(0, true);
  }

  readFloat32() {
    return this.readT('Float32', 4);
  }
  readFloat64() {
    return this.readT('Float64', 8);
  }

  // Array type
  readArrayT(reader, length) {
    if (length === undefined) {
      length = this.readUInt32();
    }
    let arr = [];
    for (let i = 0; i < length; i++) {
      arr.push(reader());
    }
    return arr;
  }

  // Specialized types
  readVector2() {
    return new Vector2(this.readFloat32(), this.readFloat32());
  }
  readIVector2() {
    return new Vector2(this.readInt32(), this.readInt32());
  }
  readVector3() {
    return new Vector3(this.readFloat32(), this.readFloat32(), this.readFloat32());
  }
  readIVector3() {
    return new Vector3(this.readInt32(), this.readInt32(), this.readInt32());
  }
  readVector4() {
    return new Vector4(this.readFloat32(), this.readFloat32(), this.readFloat32(), this.readFloat32());
  }
  readIVector4() {
    return new Vector4(this.readInt32(), this.readInt32(), this.readInt32(), this.readInt32());
  }
  readQuaternion() {
    return new Quaternion(this.readFloat32(), this.readFloat32(), this.readFloat32(), this.readFloat32());
  }
  readColor() {
    return new Color(this.readFloat32(), this.readFloat32(), this.readFloat32(), this.readFloat32());
  }
  readByteColor() {
    return new Color(this.readUInt8() / 0xFF, this.readUInt8() / 0xFF, this.readUInt8() / 0xFF, this.readUInt8() / 0xFF);
  }
  readMatrix() {
    return new Matrix4x4(this.readArrayT(this.readFloat32.bind(this), 16));
  }
  readGUID() {
    return [...this.read(16)].map(i => i.toString(16).padStart(2, '0')).join('');
  }
}
