const PAK_MAGIC = 1517228769;

export class IndexEntry {
  constructor(reader) {
    let props = reader.readUInt32();
    this.compressionBlockSize = 0;
    if ((props & 0x3f) === 0x3f) {
      this.compressionBlockSize = reader.readInt32();
    } else {
      this.compressionBlockSize = ((props & 0x3f) << 11);
    }
    this.compressionMethodIndex = (props >> 23) & 0x3f;
    let offsetIs32Bit = (props & (1 << 31)) !== 0;
    if (offsetIs32Bit) {
      this.offset = reader.readUInt32();
    } else {
      this.offset = Number(reader.readUInt64());
    }
    let uncompressedSizeIs32Bit = (props & (1 << 30)) !== 0;
    if (uncompressedSizeIs32Bit) {
      this.uncompressedSize = reader.readUInt32();
    } else {
      this.uncompressedSize = Number(reader.readUInt64());
    }
    if (this.compressionMethodIndex !== 0) {
      let rawSizeIs32Bit = (props & (1 << 29)) !== 0;
      if (rawSizeIs32Bit) {
        this.rawSize = reader.readUInt32();
      } else {
        this.rawSize = Number(reader.readUInt64());
      }
    } else {
      // No compression
      this.rawSize = this.uncompressedSize;
    }
    this.isEncrypted = (props & (1 << 22)) !== 0;
    this.compressionBlockCount = (props >> 6) & 0xffff;
    if (this.compressionBlockCount === 1) {
      // If we have a single block, make sure to read all of our data from it
      this.compressionBlockSize = this.uncompressedSize;
    }
    if (this.compressionBlockCount > 0) {
      this.compressionBlockSizePtr = reader.readUInt32();
    }
  }
}

export class PakFile {
  constructor(reader) {
    this.reader = reader;
    this.reader.endian = 'little';

    this.parse();
  }

  loadInfo() {
    this.reader.seek(this.reader.size - 4);
    const limit = 2048;
    let i = 0;
    let found = false;
    while (i < limit) {
      let val = this.reader.readUInt32();
      if (val === PAK_MAGIC) {
        found = true;
        break;
      }
      this.reader.seek(this.reader.tell() - 5);
      i++;
    }
    if (!found) {
      throw new Error('Could not find magic');
    }

    this.version = this.reader.readInt32();
    this.indexOffset = Number(this.reader.readUInt64());
    this.indexSize = Number(this.reader.readUInt64());
    this.indexHash = this.reader.read(20);
  }

  loadIndex() {
    this.reader.seek(this.indexOffset);
    this.mountPoint = this.reader.readString();
    this.numFiles = this.reader.readUInt32();
    this.fileHashSeed = Number(this.reader.readUInt64());
    this.hasFileHashIndex = !!this.reader.readInt32();
    if (this.hasFileHashIndex) {
      this.fileHashIndexOffset = Number(this.reader.readUInt64());
      this.fileHashIndexSize = Number(this.reader.readUInt64());
      this.fileHashIndexHash = this.reader.read(20);
    }
    this.hasFullDirectoryIndex = !!this.reader.readInt32();
    if (this.hasFullDirectoryIndex) {
      this.fullDirectoryIndexOffset = Number(this.reader.readUInt64());
      this.fullDirectoryIndexSize = Number(this.reader.readUInt64());
      this.fullDirectoryIndexHash = this.reader.read(20);
    }
    let indexSize = this.reader.readUInt32();
    this.index = [];
    for (let i = 0; i < this.numFiles; i++) {
      this.index.push(new IndexEntry(this.reader));
    }
  }

  parse() {
    this.loadInfo();
    this.loadIndex();
  }
}