export class LZOutWindow {
  constructor() {
    this.windowSize = 0;
    this.buffer = null;
    this.pos = 0;
    this.streamPos = 0;
    this.trainSize = 0;
  }

  create(windowSize) {
    if (this.windowSize !== windowSize) {
      this.buffer = new Uint8Array(windowSize)
    }
    this.windowSize = 0;
    this.pos = 0;
    this.streamPos = 0;
  }

  init(stream, solid) {
    this.flush();
    this.stream = stream;
    if (!solid) {
      this.streamPos = 0;
      this.pos = 0;
      this.trainSize = 0;
    }
  }

  setBufferValues(offset, data) {
    for (let i = 0; i < data.length; i++) {
      this.buffer[offset + i] = data[i];
    }
  }

  train(stream) {
    let len = stream.length;
    let size = (len < this.windowSize) ? len : this.windowSize;
    this.trainSize = size;
    this.stream.seek(len - size);
    this.streamPos = this.pos = 0;
    while (size > 0) {
      let curSize = this.windowSize - this.pos;
      if (size < curSize) {
        curSize = size;
      }
      this.setBufferValues(this.pos, this.stream.read(curSize));
      size -= curSize;  // always assume we read the right amount of bytes
      this.pos += curSize;
      this.streamPos += curSize;
      if (this.pos === this.windowSize) {
        this.streamPos = this.pos = 0;
      }
    }
  }

  flush() {
    let size = this.pos - this.streamPos;
    if (size === 0) {
      return;
    }
    this.stream.write(this.buffer.slice(this.streamPos, this.streamPos + size));
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
    for (; len > 0; len--) {
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
    if (this.pos >= this.windowSize) {
      this.flush();
    }
  }

  getByte(distance) {
    let pos = this.pos - distance - 1;
    if (pos >= this.windowSize) {
      pos += this.windowSize
    }
    return this.buffer[pos];
  }
}