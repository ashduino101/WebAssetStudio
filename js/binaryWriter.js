export const SEEK_SET = 0;
export const SEEK_CUR = 1;
export const SEEK_END = 2;

export class BinaryWriter {
  /**
   * Creates a new BinaryWriter.
   *
   * @param length {number} Initial length of data.
   * @param endian
   * @param extendSize {number} How much to extend data by if this runs out of space.
   */
  constructor(length, endian = 'big', extendSize=32768) {
    this.data = new Uint8Array(length);
    this.offset = 0;
    this.endian = endian;
    this.extendSize = extendSize;
    this.size = 0;
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

  write(data) {
    if (this.offset + data.length > this.data.length) {
      let newData = new Uint8Array(this.data.length + ((Math.ceil(data.length / this.extendSize) * this.extendSize) | 0));
      newData.set(this.data);
      this.data = newData;
    }
    this.data.set(data, this.offset);
    this.offset += data.length;
    this.size += data.length;
  }

  writeRaw(data, offset) {
    this.data.set(data, offset);
  }

  getData() {
    return this.data.slice(0, this.size);
  }

  writeCString(str) {
    let totalArray = new Uint8Array(str.length + 1);
    totalArray.set(new TextEncoder().encode(str), 0);
    totalArray[str.length] = 0;
    this.write(totalArray);
  }

  writeChars(chars) {
    this.write(new TextEncoder().encode(chars));
  }

  writeAlignedString(str) {
    this.writeInt32(str.length);
    this.writeChars(str);
    this.align(4);
  }

  writeT(type, value, length) {
    let view = new DataView(new Uint8Array(length).buffer);
    view[`set${type}`](0, value, this.endian === 'little');
    this.write(new Uint8Array(view.buffer));
  }

  writeBool(val) {
    this.writeUInt8(val);
  }

  writeUInt8(val) {
    this.writeT('Uint8', val, 1);
  }
  writeInt8(val) {
    this.writeT('Int8', val, 1);
  }
  writeUNorm8(val) {
    this.writeUInt8(Math.floor(val * 0xFF));
  }
  writeNorm8(val) {
    this.writeInt8(Math.floor(val * 0xFF));
  }
  writeUInt16(val) {
    this.writeT('Uint16', val, 2);
  }
  writeInt16(val) {
    this.writeT('Int16', val, 2);
  }
  writeUNorm16(val) {
    this.writeUInt16(Math.floor(val * 0xFFFF));
  }
  writeNorm16(val) {
    this.writeInt16(Math.floor(val * 0xFFFF));
  }
  writeUInt32(val) {
    this.writeT('Uint32', val, 4);
  }
  writeInt32(val) {
    this.writeT('Int32', val, 4);
  }
  writeUInt64(val) {
    this.writeT('BigUint64', BigInt(val), 8);
  }
  writeInt64(val) {
    this.writeT('BigInt64', BigInt(val), 8);
  }

  // readFloat16() {  // extremely jank fp16 implementation
  //   let raw = new DataView(this.read(2).buffer).getUint16(0, true);
  //   // Convert to fp32
  //   const w = raw * 65536;  // avoid javascript issues
  //   const sign = w & 0x80000000;
  //   const nonsign = w & 0x7FFFFFFF;
  //   let renormShift = Math.clz32(nonsign);
  //   renormShift = renormShift > 5 ? renormShift - 5 : 0;
  //   const infNanMask = ((nonsign + 0x04000000) >> 8) & 0x7F800000;
  //   const zeroMask = (nonsign - 1) >> 31;
  //   const intVal = sign | ((((nonsign << renormShift >> 3) + ((0x70 - renormShift) << 23)) | infNanMask) & ~zeroMask);
  //   const view = new DataView(new Uint8Array(4).buffer);
  //   view.setUint32(0, intVal, true);
  //   return view.getFloat32(0, true);
  // }

  writeFloat32(val) {
    this.writeT('Float32', val, 4);
  }
  writeFloat64(val) {
    this.writeT('Float64', val, 8);
  }

  // Array type
  writeArrayT(writer, arr, length) {
    if (typeof length == 'undefined') {
      this.writeUInt32(arr.length);
    }
    for (let i of arr) {
      writer(i);
    }
  }

  // Specialized types
  writeVector2(val) {
    this.writeFloat32(val.x);
    this.writeFloat32(val.y);
  }
  writeIVector2(val) {
    this.writeInt32(val.x);
    this.writeInt32(val.y);
  }
  writeVector3(val) {
    this.writeFloat32(val.x);
    this.writeFloat32(val.y);
    this.writeFloat32(val.z);
  }
  writeIVector3(val) {
    this.writeInt32(val.x);
    this.writeInt32(val.y);
    this.writeInt32(val.z);
  }
  writeVector4(val) {
    this.writeFloat32(val.x);
    this.writeFloat32(val.y);
    this.writeFloat32(val.z);
    this.writeFloat32(val.w);
  }
  writeQuaternion(val) {
    this.writeFloat32(val.x);
    this.writeFloat32(val.y);
    this.writeFloat32(val.z);
    this.writeFloat32(val.w);
  }
  writeColor(val) {
    this.writeFloat32(val.r);
    this.writeFloat32(val.g);
    this.writeFloat32(val.b);
    this.writeFloat32(val.a);
  }
  writeByteColor(val) {
    this.writeUInt8(Math.floor(val.r / 255));
    this.writeUInt8(Math.floor(val.g / 255));
    this.writeUInt8(Math.floor(val.b / 255));
    this.writeUInt8(Math.floor(val.a / 255));
  }
  writeMatrix(val) {
    this.writeArrayT(this.writeFloat32.bind(this), val, 16);
  }
}