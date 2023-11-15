class WebData {
  static exposedAttributes = [
    'offset',
    'size',
    'path'
  ];

  constructor(reader) {
    this.offset = reader.readInt32();
    this.size = reader.readInt32();
    this.path = reader.readString();
  }
}

export class WebFile {
  static exposedAttributes = [
    'files'
  ];

  constructor(reader) {
    reader.endian = 'little';
    let signature = reader.readCString();
    let headLength = reader.readInt32();
    this.files = [];
    while (reader.tell() < headLength) {
      this.files.push(new WebData(reader));
    }
    this.reader = reader;
  }

  get(path) {
    const file = this.files.filter(f => f.path === path)[0];
    if (!file) return null;
    this.reader.seek(file.offset);
    return this.reader.read(file.size);
  }

  async parse() {  // nothing to do here
  }
}