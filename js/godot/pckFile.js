import sortPaths from 'sort-paths'

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

    if (this.fileFlags & 1) {
      throw new Error('PCK is encrypted');
    }

    reader.read(64);  // reserved

    this.numFiles = reader.readUInt32();
    this.files = [];
    for (let i = 0; i < this.numFiles; i++) {
      this.files.push(new PckEntry(reader, this.formatVersion, this.fileOffset, origOffset));
    }
    this.pathOrder = sortPaths(this.files.map(f => f.path), '/');
  }
}
