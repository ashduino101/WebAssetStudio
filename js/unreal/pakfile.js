import './version'
import {BinaryWriter} from "../binaryWriter";
import {decompress} from "./utils";
import JSZip from "jszip";

export const PAK_MAGIC = 1517228769;

const PakFile_Version_Initial = 1,
  PakFile_Version_NoTimestamps = 2,
  PakFile_Version_CompressionEncryption = 3,
  PakFile_Version_IndexEncryption = 4,
  PakFile_Version_RelativeChunkOffsets = 5,
  PakFile_Version_DeleteRecords = 6,
  PakFile_Version_EncryptionKeyGuid = 7,
  PakFile_Version_FNameBasedCompressionMethod = 8,
  PakFile_Version_FrozenIndex = 9,
  PakFile_Version_PathHashIndex = 10,
  PakFile_Version_Fnv64BugFix = 11;

export class Entry {
  constructor(reader, version, compressionMethods) {
    this.name = reader.readString();
    this.offset = Number(reader.readUInt64());
    this.compressedSize = Number(reader.readUInt64());
    this.uncompressedSize = Number(reader.readUInt64());
    if (version < PakFile_Version_FNameBasedCompressionMethod) {
      this.compressionMethod = [
        'None',
        'Zlib',
        'GZip',
        'Custom'
      ][reader.readUInt32()];
      this.compressionMethodIndex = -1;
    } else {
      this.compressionMethodIndex = reader.readUInt32();
      this.compressionMethod = compressionMethods[this.compressionMethodIndex - 1] ?? 'None';
    }
    if (version <= PakFile_Version_Initial) {
      this.timeStamp = reader.readUInt64();  // TODO: this is an FDateTime, not a u64
    }
    this.hash = reader.read(20);
    if (version >= PakFile_Version_CompressionEncryption) {
      this.compressionBlocks = [];
      if (this.compressionMethodIndex !== 0) {
        let numCompressionBlocks = reader.readUInt32();
        for (let i = 0; i < numCompressionBlocks; i++) {
          this.compressionBlocks.push({
            start: Number(reader.readUInt64()),
            end: Number(reader.readUInt64())
          });
        }
      }
      let flags = reader.readUInt8();
      this.isEncrypted = flags & 0x01;
      this.isDeleted = flags & 0x02;
      this.compressionBlockSize = reader.readUInt32();
    }
  }
}

export class IndexEntry {
  constructor(reader, version, compressionMethods) {
    let props = reader.readUInt32();
    this.compressionBlockSize = 0;
    if ((props & 0x3f) === 0x3f) {
      this.compressionBlockSize = reader.readInt32();
    } else {
      this.compressionBlockSize = ((props & 0x3f) << 11);
    }
    this.compressionMethodIndex = (props >> 23) & 0x3f;
    this.compressionMethod = compressionMethods[this.compressionMethodIndex - 1] ?? 'None';
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
    if (this.version >= PakFile_Version_FrozenIndex && this.version < PakFile_Version_PathHashIndex) {
      this.indexFrozen = this.reader.readBool();
    }
    if (this.version >= PakFile_Version_FNameBasedCompressionMethod) {
      this.compressionMethods = [];
      for (let i = 0; i < 5; i++) {  // up to 5 compression methods
        let method = this.reader.readChars(32).split('\0')[0];
        if (method === '') break;
        this.compressionMethods.push(method);
      }
    }
    console.log(this.compressionMethods);
  }

  loadIndex() {
    this.reader.seek(this.indexOffset);
    this.mountPoint = this.reader.readString();
    this.numFiles = this.reader.readUInt32();
    if (this.version >= 10) {
      this.fileHashSeed = this.reader.readUInt64();
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
      this.indexMap = new Map();
      for (let i = 0; i < this.numFiles; i++) {
        const e = new IndexEntry(this.reader, this.version, this.compressionMethods);
        this.index.push(e);
        this.indexMap.set(i, e);
      }
    } else {
      this.index = [];
      this.indexMap = new Map();
      for (let i = 0; i < this.numFiles; i++) {
        const e = new Entry(this.reader, this.version, this.compressionMethods);
        this.index.push(e);
        this.indexMap.set(e.name, e);
      }
    }
    console.log(this.index)
    console.log(this.readEntry(this.index[203]));
    // console.log(this.getEntry('MusePackage/Content/Native/Levels/City_BuiltData.ubulk'));
    // let ix = this.index;
    // ix.sort((a, b) => a.uncompressedSize - b.uncompressedSize);
    // ix.forEach(i => console.log(i.name, i.uncompressedSize))

  }

  readEntry(entry) {
    if (typeof entry.compressionBlocks == 'undefined') {
      this.reader.seek(entry.offset);
      (this.version >= 10) ?
        new IndexEntry(this.reader, this.version, this.compressionMethods) :
        new Entry(this.reader, this.version, this.compressionMethods);  // get past the entry before the data
      return this.reader.read(entry.uncompressedSize);
    }
    let res = new BinaryWriter(entry.uncompressedSize);
    for (let block of entry.compressionBlocks) {
      this.reader.seek(entry.offset + block.start);
      res.write(decompress(this.reader.read(block.end - block.start), entry.compressionMethod));
    }
    return res.getData();
  }

  getEntry(name) {
    return this.readEntry(this.indexMap.get(name));
  }

  // For exporting without parsing .uassets etc.
  async exportRawZip() {
    let zip = new JSZip();
    for (let e of this.index) {
      zip.file(e.name, this.readEntry(e));
    }
    return await zip.generateAsync({type: 'uint8array'});
  }

  parse() {
    this.loadInfo();
    this.loadIndex();
  }
}