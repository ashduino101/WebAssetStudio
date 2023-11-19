export class PackedFloatVector {
  static exposedAttributes = [
    'length',
    'range',
    'start',
    'bitSize'
  ];

  constructor(reader) {
    this.length = reader.readUInt32();
    this.range = reader.readFloat32();
    this.start = reader.readFloat32();

    this.data = reader.read(reader.readUInt32());
    reader.align(4);

    this.bitSize = reader.read(1)[0];
    reader.align(4);
  }

  unpack(chunkItemCount, chunkStride, start = 0, numChunks = -1) {
    let bitPos = this.bitSize * start;
    let indexPos = bitPos / 8;
    bitPos %= 8;
    let scale = 1 / this.range;
    if (numChunks === -1) {
      numChunks = Math.floor(this.length / chunkItemCount);
    }
    let end = chunkStride * numChunks / 4;
    let data = [];
    for (let index = 0; index < end; index += chunkStride / 4) {
      for (let i = 0; i < chunkItemCount; i++) {
        let x = 0;
        let bits = 0;
        while (bits < this.bitSize) {
          x |= (this.data[indexPos] >> bitPos) << bits;
          let num = Math.min(this.bitSize - bits, 8 - bitPos);
          bitPos += num;
          bits += num;
          if (bitPos >= 8) {
            indexPos++;
            bitPos = 0;
          }
        }
        x &= (1 << this.bitSize) - 1;
        data.push(x / (scale * ((1 << this.bitSize) - 1)) + this.start);
      }
    }
    return data;
  }
}

export class PackedIntVector {
  static exposedAttributes = [
    'length',
    'bitSize'
  ];

  constructor(reader) {
    this.length = reader.readUInt32();

    this.data = reader.read(reader.readUInt32());
    reader.align(4);

    this.bitSize = reader.read(1)[0];
    reader.align(4);
  }

  unpack() {
    let data = [];
    let indexPos = 0;
    let bitPos = 0;
    for (let i = 0; i < this.length; i++) {
      let bits = 0;
      let x = 0;
      while (bits < this.bitSize) {
        x |= (this.data[indexPos] >> bitPos) << bits;
        let num = Math.min(this.bitSize - bits, 8 - bitPos);
        bitPos += num;
        bits += num;
        if (bitPos >= 8) {
          indexPos++;
          bitPos = 0;
        }
      }
      x &= (1 << this.bitSize) - 1;
      data.push(x);
    }
    return data;
  }
}

export class PackedQuaternionVector {
  static exposedAttributes = [
    'length',
    'bitSize'
  ];

  constructor(reader) {
    this.length = reader.readUInt32();

    this.data = reader.read(reader.readUInt32());
    reader.align(4);

    this.bitSize = reader.read(1)[0];
    reader.align(4);
  }

  unpack() {
    let data = [];
    let indexPos = 0;
    let bitPos = 0;
    for (let i = 0; i < this.length; i++) {
      let flags = 0;
      let bits = 0;
      while (bits < 3) {
        flags |= (this.data[indexPos] >> bitPos) << bits;
        let num = Math.min(3 - bits, 8 - bitPos);
        bitPos += num;
        bits += num;
        if (bitPos >= 8) {
          indexPos++;
          bitPos = 0;
        }
      }
      flags &= 7;

      let quat = new Quaternion();
      let sum = 0;
      for (let j = 0; j < 4; j++) {
        if (j !== (flags & 3)) {
          let bitSize = j === (((flags & 3) + 1) % 4) ? 9 : 10;
          let x = 0;
          let bits = 0;
          while (bits < bitSize) {
            x |= (this.data[indexPos] >> bitPos) << bits;
            let num = Math.min(bitSize - bits, 8 - bitPos);
            bitPos += num;
            bits += num;
            if (bitPos >= 8) {
              indexPos++;
              bitPos = 0;
            }
          }
          x &= (1 << bitSize) - 1;
          quat.setIndex(j, x / (0.5 * ((1 << bitSize) - 1)) - 1);
          sum += quat.getIndex(j) ** 2;
        }
      }

      let lastComponent = flags & 3;
      quat.setIndex(lastComponent, Math.sqrt(1 - sum));
      if ((flags & 4) !== 0) {
        quat.setIndex(lastComponent, -quat.getIndex(lastComponent));
      }
      data.push(quat);
    }
    return data;
  }
}
