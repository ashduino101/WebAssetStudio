export class BasicStream {
  constructor(data, length) {
    this.data = data ?? new Uint8Array(length);
    this.offset = 0;  // stream offset
    // this.bufferOffset = 0;  // buffer offset
    // this.bufferSize = (1 << 20);
    // this.buffer = new Uint8Array(this.bufferSize);
  }

  seek(pos) {
    this.offset = pos;
  }

  read(nbytes) {
    return this.data.slice(this.offset, this.offset += nbytes);
  }

  readByte() {
    return this.read(1)[0];
  }

  write(data) {
    this.data.set(data, this.offset += data.length);

    // if (data.length < (this.bufferSize - this.bufferOffset)) {
    //   this.buffer.set(data, this.bufferOffset);
    //   this.bufferOffset += data.length;
    //   return;
    // }
    // this.flush();
    // let segmentCount = Math.ceil(data.length / this.bufferSize);
    // for (let i = 0; i < segmentCount; i++) {
    //   this.buffer.set(data.slice(i * this.bufferSize, (i + 1) * this.bufferSize), 0);
    //   this.flush();
    // }
  }

  writeByte(b) {
    this.write([b]);
  }

  // flush() {
  //   let bufferFilledSize = this.bufferOffset;
  //   let newArray = new Uint8Array(this.data.length + bufferFilledSize);
  //   newArray.set(this.data, 0);
  //   newArray.set(this.buffer.slice(0, bufferFilledSize), this.data.length);
  //   this.data = newArray;
  // }
}