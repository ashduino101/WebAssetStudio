export class PPtr {
  static exposedAttributes = [
    'fileID',
    'pathID'
  ]

  constructor(reader) {
    this.fileID = reader.readInt32();
    this.pathID = reader.fileVersion < 14 ? reader.readInt32() : Number(reader.readInt64());
  }

  getAsset() {

  }
}