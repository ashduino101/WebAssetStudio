import sortPaths from 'sort-paths'
import {BinaryReader} from "../binaryReader";
import aes from 'aes-js';

class PckEntry {
  constructor(reader, fmtVersion, fileOffset, origOffset) {
    this.path = reader.readString();
    this.offset = fileOffset + Number(reader.readUInt64()) - origOffset;
    this.size = Number(reader.readUInt64());
    this.hash = reader.readGUID();

    this.flags = 0;
    if (fmtVersion >= 2) {
      this.flags = reader.readUInt32();
    }
  }
}

export class PckFile {
  constructor(reader, origOffset = 0) {
    if (reader.readChars(4) !== 'GDPC') {
      throw new Error('Not a Godot package!');
    }
    this.formatVersion = reader.readUInt32();
    this.major = reader.readUInt32();
    this.minor = reader.readUInt32();
    this.patch = reader.readUInt32();

    this.fileFlags = 0;
    this.fileOffset = 0;
    if (this.formatVersion >= 2) {
      this.fileFlags = reader.readUInt32();
      this.fileOffset = Number(reader.readUInt64());
    }

    reader.read(64);  // reserved

    this.numFiles = reader.readUInt32();

    if (this.fileFlags & 1) {
      throw new Error('Cannot load PCK with encrypted dir');
      // const md5 = reader.readGUID();
      // const length = reader.readUInt64();
      // const iv = reader.read(16);
      // let encData = reader.read(Number(length));
      // const key = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      // console.log('keylen:', key.length)
      // const aesCfb = new aes.ModeOfOperation.cfb(key, iv);
      // console.log(aesCfb.decrypt(encData));
    }

    this.files = [];
    for (let i = 0; i < this.numFiles; i++) {
      this.files.push(new PckEntry(reader, this.formatVersion, this.fileOffset, origOffset));
    }
    this.reader = reader;

    this.pathOrder = sortPaths(this.files.map(f => f.path), '/');
  }

  getFile(path) {
    if (!path.startsWith('res://')) {
      path = 'res://' + path;
    }
    return this.files.filter(f => f.path === path)[0];
  }

  getData(file) {
    this.reader.seek(file.offset);
    return this.reader.read(file.size);
  }
}
