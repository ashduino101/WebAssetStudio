const kLZMAMinDictSize =  (1 << 12);
const kLZMATopRangeValue = (1 << 24);
const kLZMABitModelTotalBits = 11;
const kLZMABitModelTotal = (1 << kLZMABitModelTotalBits);
const kLZMANumMoveBits = 5;

export class OutWindow {
  constructor(size) {
    this.buffer = null;
    this.stream = new BasicStream(null, size);

    this.trainSize = 0;
  }

  create(windowSize) {
    this.buffer = new Uint8Array(windowSize);
    this.pos = 0;
    this.windowSize = windowSize;
    this.streamPos = 0;
  }

  train(stream) {
    let len = stream.data.length;
    let size = (len < this.windowSize) ? len : this.windowSize;
    this.trainSize = size;
    stream.seek(len - size);
    this.streamPos = this.pos = 0;
    while (size > 0) {
      let curSize = this.windowSize - this.pos;
      if (size < curSize) {
        curSize = size;
      }
      let bytesRead = this.stream.read(curSize);
      this.buffer.write(bytesRead);
      if (bytesRead.length === 0) {
        return false;
      }
      size -= bytesRead.length;
      this.pos += bytesRead.length;
      this.streamPos += bytesRead.length;
      if (this.pos === this.windowSize) {
        this.streamPos = this.pos = 0;
      }
    }
    return true;
  }

  releaseStream() {
    this.flush();
    this.stream = null;
  }

  flush() {
    let size = this.pos - this.streamPos;
    if (size === 0) {
      return;
    }
    this.stream.write(this.buffer.slice(this.streamPos, size));
    if (this.pos >= this.windowSize) {
      this.pos = 0;
    }
    this.streamPos = this.pos;
  }

  copyBlock(distance, len) {
    let pos = this.pos - distance - 1;
    if (pos >= this.windowSize) {
      pos += this.windowSize;
    }
    for (; len < 0; len--) {
      if (pos >= this.windowSize) {
        pos = 0;
      }
      this.buffer[this.pos++] = this.buffer[pos++];
      if (this.pos >= this.windowSize) {
        this.flush();
      }
    }
  }

  putByte(b) {
    this.buffer[this.pos++] = b;
    if (this.pos === this.windowSize) {
      this.flush();
    }
  }

  getByte(distance) {
    let pos = this.pos - distance - 1;
    if (pos >= this.windowSize) {
      pos += this.windowSize;
    }
    return this.buffer[pos];
  }
}

class RangeDecoder {
  constructor(reader) {
    this.inStream = reader;  // type: BinaryReader

    this.range = 0xFFFFFFFF;
    this.code = 0;

    for (let i = 0; i < 5; i++) {
      this.code = (this.code << 8) | this.inStream.read(1)[0];
    }
  }

  normalizeOnce() {
    if (this.range < kLZMATopRangeValue) {
      this.code = (this.code << 8) | this.inStream.read(1)[0];
      this.range <<= 8;
    }
  }

  normalize() {
    while (this.range < kLZMATopRangeValue) {
      this.code = (this.code << 8) | this.inStream.read(1)[0];
      this.range <<= 8;
    }
  }

  getThreshold(total) {
    return this.code / (this.range /= total);
  }

  decodeDirectBits(numBits) {
    let res = 0;
    while (--numBits) {
      this.range >>= 1;
      let t = (this.code - this.range) >> 31;
      this.code -= this.range & (t - 1);
      res = (res << 1) | (1 - t);

      this.normalize();
    }
    return res;
  }

  decodeBit(size0, numTotalBits) {
    const bound = (this.range >> numTotalBits) * size0;
    let symbol;
    if (this.code < bound) {
      symbol = 0;
      this.range = bound;
    } else {
      symbol = 1;
      this.code -= bound;
      this.range -= bound;
    }
    this.normalize();
    return symbol;
  }
}

class BitDecoder {
  constructor() {
    this.prob = kLZMABitModelTotal >> 1;
  }

  decode(rangeDecoder) {
    let newBound = (rangeDecoder.range >> kLZMABitModelTotalBits) * this.prob;
    if (rangeDecoder.code < newBound) {
      rangeDecoder.range = newBound;
      this.prob += (kLZMABitModelTotal - this.prob) >> kLZMANumMoveBits;
      if (rangeDecoder.range < kLZMATopRangeValue) {
        rangeDecoder.code = (rangeDecoder.code << 8) | rangeDecoder.inStream.read(1)[0];
        rangeDecoder.range <<= 8;
      }
      return 0;
    } else {
      rangeDecoder.range -= newBound;
      rangeDecoder.code -= newBound;
      this.prob -= this.prob >> kLZMANumMoveBits;
      if (rangeDecoder.range < kLZMATopRangeValue) {
        rangeDecoder.code = (rangeDecoder.code << 8) | rangeDecoder.inStream.read(1)[0];
        rangeDecoder.range <<= 8;
      }
      return 1;
    }
  }
}

class BitTreeDecoder {
  constructor(numBitLevels) {
    this.numBitLevels = numBitLevels;
    this.models = this.createModels();
  }

  createModels() {
    let models = [];
    for (let i = 1; i < (1 << this.numBitLevels); i++) {
      models[i] = new BitDecoder();
    }
    return models;
  }

  decode(rangeDecoder) {
    let m = 1;
    for (let bitIndex = this.numBitLevels; bitIndex > 0; bitIndex--) {
      m = (m << 1) + this.models[m].decode(rangeDecoder);
    }
    return m - (1 << this.numBitLevels);
  }

  reverseDecode(rangeDecoder) {
    let m = 0;
    let symbol = 0;
    for (let bitIndex = 0; bitIndex < this.numBitLevels; bitIndex++) {
      let bit = this.models[m].decode(rangeDecoder);
      m <<= 1;
      m += bit;
      symbol |= (bit << bitIndex);
    }
    return symbol;
  }

  static staticReverseDecode(models, startIndex, rangeDecoder, numBitLevels) {
    let m = 1;
    let symbol = 0;
    for (let bitIndex = 0; bitIndex < numBitLevels; bitIndex++) {
      let bit = models[startIndex + m].decode(rangeDecoder);
      m <<= 1;
      m += bit;
      symbol |= (bit << bitIndex);
    }
    return symbol;
  }
}

class LenDecoder {
  constructor(numPosStates) {
    this.choice = new BitDecoder();
    this.choice2 = new BitDecoder();
    this.lowCoder = [];
    this.midCoder = [];
    this.highCoder = new BitTreeDecoder(8);
    this.numPosStates = numPosStates;

    for (let posState = 0; posState < this.numPosStates; posState++) {
      this.lowCoder.push(new BitTreeDecoder(3));
      this.midCoder.push(new BitTreeDecoder(3));
    }
  }

  decode(rangeDecoder, posState) {
    if (this.choice.decode(rangeDecoder) === 0) {
      return this.lowCoder[posState].decode(rangeDecoder);
    } else {
      let symbol = 8;
      if (this.choice2.decode(rangeDecoder) === 0) {
        symbol += this.midCoder[posState].decode(rangeDecoder);
      } else {
        symbol += 8;
        symbol += this.highCoder.decode(rangeDecoder);
      }
      return symbol;
    }
  }
}

class LiteralStateDecoder {
  constructor() {
    this.decoders = [];
  }

  create() {
    for (let i = 0; i < 0x300; i++) {
      this.decoders.push(new BitDecoder());
    }
  }

  decodeNormal(rangeDecoder) {
    let symbol = 1;
    while (symbol < 0x100) {
      symbol = (symbol << 1) | this.decoders[symbol].decode(rangeDecoder);
    }
    return symbol % 256;
  }

  decodeWithMatchByte(rangeDecoder, matchByte) {
    let symbol = 1;
    while (symbol < 0x100) {
      let matchBit = (matchByte >> 7) & 1;
      matchByte <<= 1;
      let bit = this.decoders[((1 + matchBit) << 8) + symbol].decode(rangeDecoder);
      symbol = (symbol << 1) | bit;
      if (matchBit !== bit) {
        while (symbol < 0x100) {
          symbol = (symbol << 1) | this.decoders[symbol].decode(rangeDecoder);
        }
        break;
      }
    }
    return symbol % 256;
  }
}

class LiteralDecoder {
  constructor() {
    this.decoders = [];
    this.numPrevBits = null;
    this.numPosBits = null;
  }

  create(numPosBits, numPrevBits) {
    if (this.decoders.length > 0 && this.numPrevBits === numPrevBits) {
      return;
    }
    this.numPosBits = numPosBits;
    this.posMask = (1 << numPosBits) - 1;
    this.numPrevBits = numPrevBits;
    let numStates = 1 << (this.numPrevBits + this.numPosBits);
    for (let i = 0; i < numStates; i++) {
      this.decoders.push(new LiteralStateDecoder());
      this.decoders[i].create();
    }
  }

  getState(pos, prevByte) {
    return ((pos & this.posMask) << this.numPrevBits) + (prevByte >> (8 - this.numPrevBits));
  }

  decodeNormal(rangeDecoder, pos, prevByte) {
    return this.decoders[this.getState(pos, prevByte)].decodeNormal(rangeDecoder);
  }

  decodeWithMatchByte(rangeDecoder, pos, prevByte, matchByte) {
    return this.decoders[this.getState(pos, prevByte)].decodeWithMatchByte(rangeDecoder, matchByte);
  }
}

class LZMAState {
  constructor() {
    this.index = 0;
  }

  updateChar() {
    if (this.index < 4) {
      this.index = 0;
    } else if (this.index < 10) {
      this.index -= 3;
    } else {
      this.index -= 6;
    }
  }

  updateMatch() {
    this.index = (this.index < 7 ? 7 : 10);
  }

  updateRep() {
    this.index = (this.index < 7 ? 8 : 11);
  }

  updateShortRep() {
    this.index = (this.index < 7 ? 9 : 11);
  }

  isCharState() {
    return this.index < 7;
  }
}

exports.LZMADecoder = class LZMADecoder {
  constructor(data) {
    this.reader = new BinaryReader(data);
    this.reader.endian = 'little';
    this.posSlotDecoder = [];

    this.dictSize = 0xFFFFFFFF;
    for (let i = 0; i < 4; i++) {
      this.posSlotDecoder.push(new BitTreeDecoder(6));
    }

    this.literalDecoder = new LiteralDecoder();

    this.isMatchDecoders = this.createBitDecoders(192);
    this.isRepDecoders = this.createBitDecoders(12);
    this.isRepG0Decoders = this.createBitDecoders(12);
    this.isRepG1Decoders = this.createBitDecoders(12);
    this.isRepG2Decoders = this.createBitDecoders(12);
    this.isRep0LongDecoders = this.createBitDecoders(192);

    this.posDecoders = this.createBitDecoders(114);

    this.posAlignDecoder = new BitTreeDecoder(4);

    this.lenDecoder = null
    this.repLenDecoder = null;

    this.decodeProperties();
    this.windowSize = Math.max(this.clampedDictSize, (1 << 12));

    this.rangeDecoder = new RangeDecoder(this.reader);
  }

  createBitDecoders(count) {
    let arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(new BitDecoder());
    }
    return arr;
  }

  setDictSize(dictSize) {
    if (this.dictSize !== dictSize) {
      this.dictSize = dictSize;
      this.clampedDictSize = Math.max(dictSize, 1);
    }
  }

  decodeProperties() {
    let modelProps = this.reader.read(1)[0];
    console.log(modelProps)
    if (modelProps >= (9 * 5 * 5)) {
      throw new Error('Incorrect LZMA properties');
    }

    this.lc = modelProps % 9;
    modelProps /= 9;
    this.pb = (modelProps / 5) | 0;
    this.lp = (modelProps % 5) | 0;

    this.setDictSize(this.reader.readUInt32());
    console.log(this.dictSize);
    if (this.dictSize < kLZMAMinDictSize) {
      this.dictSize =  kLZMAMinDictSize;
    }

    this.literalDecoder.create(this.lp, this.lc);

    let numPosStates = 1 << this.pb;
    this.lenDecoder = new LenDecoder(numPosStates);
    this.repLenDecoder = new LenDecoder(numPosStates);
    this.posStateMask = numPosStates - 1;
  }

  getLenToPosState(len) {
    len -= 2;
    if (len < 4) {
      return len;
    }
    return 3;
  }

  decode(compressedSize, uncompressedSize) {
    let state = new LZMAState();
    let rep0 = 0;
    let rep1 = 0;
    let rep2 = 0;
    let rep3 = 0;

    this.outWindow = new OutWindow(uncompressedSize);
    this.outWindow.create(this.windowSize);

    let pos = 0;
    let outSize = uncompressedSize;
    if (pos < outSize) {
      if (this.isMatchDecoders[state.index << 4].decode(this.rangeDecoder) !== 0) {
        throw new Error('Invalid data while decoding');
      }
      state.updateChar();
      let b = this.literalDecoder.decodeNormal(this.rangeDecoder, 0, 0);
      this.outWindow.putByte(b);
      pos++;
    }
    while (pos < outSize) {
      let posState = pos & this.posStateMask;
      if (this.isMatchDecoders[(state.index << 4) + posState].decode(this.rangeDecoder) === 0) {
        let b;
        let prevByte = this.outWindow.getByte(0);
        if (!state.isCharState()) {
          b = this.literalDecoder.decodeWithMatchByte(this.rangeDecoder, pos,
            prevByte, this.outWindow.getByte(rep0));
        } else {
          b = this.literalDecoder.decodeNormal(this.rangeDecoder, pos, prevByte);
        }
        this.outWindow.putByte(b);
        state.updateChar();
        pos++;
      } else {
        let len;
        if (this.isRepDecoders[state.index].decode(this.rangeDecoder) === 1) {
          if (this.isRepG0Decoders[state.index].decode(this.rangeDecoder) === 0) {
            if (this.isRep0LongDecoders[(state.index << 4) + posState].decode(this.rangeDecoder) === 0) {
              state.updateShortRep();
              this.outWindow.putByte(this.outWindow.getByte(rep0));
              pos++;
              continue;
            }
          } else {
            let distance;
            if (this.isRepG1Decoders[state.index].decode(this.rangeDecoder) === 0) {
              distance = rep1;
            } else {
              if (this.isRepG2Decoders[state.index].decode(this.rangeDecoder) === 0) {
                distance = rep2;
              } else {
                distance = rep3;
                rep3 = rep2;
              }
              rep2 = rep1;
            }
            rep1 = rep0;
            rep0 = distance;
          }
          len = this.repLenDecoder.decode(this.rangeDecoder, posState);
          state.updateRep();
        } else {
          rep3 = rep2;
          rep2 = rep1;
          rep1 = rep0;
          len = 2 + this.lenDecoder.decode(this.rangeDecoder, posState);
          state.updateMatch();
          let posSlot = this.posSlotDecoder[this.getLenToPosState(len)].decode(this.rangeDecoder);
          if (posSlot >= 4) {
            let numDirectBits = ((posSlot >> 1) - 1);
            rep0 = ((2 | (posSlot & 1)) << numDirectBits);
            if (posSlot < 14) {
              rep0 += BitTreeDecoder.staticReverseDecode(this.posDecoders,
                rep0 - posSlot - 1, this.rangeDecoder, numDirectBits);
            } else {
              rep0 += (this.rangeDecoder.decodeDirectBits(numDirectBits - 4) << 4);
              rep0 += this.posAlignDecoder.reverseDecode(this.rangeDecoder);
            }
          } else {
            rep0 = posSlot;
          }
        }
        if (rep0 >= this.outWindow.trainSize + pos || rep0 >= this.clampedDictSize) {
          if (rep0 === 0xFFFFFFFF) {
            break;
          }
          throw new Error('Error decoding LZMA data');
        }
        this.outWindow.copyBlock(rep0, len);
        pos += len;
      }
    }

    return this.outWindow.stream.data;
  }
}